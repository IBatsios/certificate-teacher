// Railway infrastructure as code: the project as it runs in production.
// Imported with `railway config pull` in Task 08 and edited to track main.
// Variables are preserve(): their values live only in Railway. Review with
// `railway config plan`; apply only on purpose with `railway config apply`.
import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  service,
  volume,
} from "railway/iac";

export default defineRailway(() => {
  const Postgres = postgres("Postgres", { region: "iad" });
  Postgres.networking = { privateNetworkEndpoint: "postgres" };
  const postgresVolume = volume("postgres-volume", {
    alerts: { usage: { "100": {}, "80": {}, "95": {} } },
    allowOnlineResize: true,
    region: "iad",
    sizeMB: 500,
  });
  const certificateTeacher = service("certificate-teacher", {
    source: github("IBatsios/certificate-teacher", { branch: "main" }),
    start: "pnpm start",
    healthcheck: "/",
    healthcheckTimeout: 120,
    preDeploy: "pnpm prisma migrate deploy",
    replicas: { iad: 1 },
    deploy: { restartPolicyMaxRetries: 5 },
    domains: ["teacher.ioannisbatsios.com"],
    env: {
      AUTH_RESEND_KEY: preserve(),
      AUTH_SECRET: preserve(),
      AUTH_TRUST_HOST: preserve(),
      AUTH_URL: preserve(),
      DATABASE_URL: preserve(),
      EMAIL_FROM: preserve(),
      EMAIL_SERVER: preserve(),
      ORIGIN_SECRET: preserve(),
    },
  });

  return project("teacher", {
    resources: [certificateTeacher, Postgres, postgresVolume],
  });
});
