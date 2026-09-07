"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkCertificate,
  MAX_CERTIFICATE_BYTES,
  parseCertificate,
  type ParseFailureReason,
} from "@/lib/certificate";
import { allowCertificateCheck } from "@/lib/certificate-limits";
import { saveSubmission } from "@/lib/certificate-submission";
import { requireRole } from "@/lib/session";
import {
  VERIFY_PATH,
  verifyPageWithMessage,
  type VerifyMessageKey,
} from "./messages";

/**
 * Checks the pair a student submitted and keeps the verdict.
 *
 * Nothing is stored until both files have been read and neither holds a
 * private key. Redirects happen outside try/catch because `redirect` throws.
 */
export async function checkSubmission(formData: FormData): Promise<void> {
  const student = await requireRole("student");

  if (!(await allowCertificateCheck(student.id))) {
    redirect(verifyPageWithMessage("too-many"));
  }

  const rootField = await readField(formData, "rootFile", "rootText");
  const leafField = await readField(formData, "leafFile", "leafText");
  if (rootField.kind === "too-large" || leafField.kind === "too-large") {
    redirect(verifyPageWithMessage("too-large"));
  }
  if (rootField.kind === "empty" || leafField.kind === "empty") {
    redirect(verifyPageWithMessage("no-files"));
  }

  const root = parseCertificate(rootField.text);
  if (!root.ok) {
    redirect(verifyPageWithMessage(failureMessage(root.reason, "root")));
  }
  const leaf = parseCertificate(leafField.text);
  if (!leaf.ok) {
    redirect(verifyPageWithMessage(failureMessage(leaf.reason, "leaf")));
  }

  const report = checkCertificate(leaf.certificate.pem, root.certificate.pem);

  let saved = true;
  try {
    await saveSubmission(student.id, leaf.certificate, report);
    revalidatePath(VERIFY_PATH);
  } catch (error) {
    console.error("Could not save a certificate submission", error);
    saved = false;
  }
  redirect(saved ? VERIFY_PATH : verifyPageWithMessage("not-saved"));
}

type SubmittedField =
  | Readonly<{ kind: "text"; text: string }>
  | Readonly<{ kind: "empty" }>
  | Readonly<{ kind: "too-large" }>;

/**
 * The text of one certificate: the uploaded file when there is one, otherwise
 * the pasted box. An oversized file is reported without being read, so a large
 * upload never becomes a large string in memory.
 */
async function readField(
  formData: FormData,
  fileName: string,
  textName: string,
): Promise<SubmittedField> {
  const file = formData.get(fileName);
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_CERTIFICATE_BYTES) {
      return { kind: "too-large" };
    }
    const text = (await file.text()).trim();
    return text === "" ? { kind: "empty" } : { kind: "text", text };
  }
  const pasted = formData.get(textName);
  if (typeof pasted !== "string" || pasted.trim() === "") {
    return { kind: "empty" };
  }
  return { kind: "text", text: pasted.trim() };
}

function failureMessage(
  reason: ParseFailureReason,
  which: "root" | "leaf",
): VerifyMessageKey {
  if (reason === "contains-private-key") {
    return "private-key";
  }
  if (reason === "too-large") {
    return "too-large";
  }
  return which === "root" ? "root-not-a-certificate" : "leaf-not-a-certificate";
}
