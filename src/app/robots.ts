import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/dashboard",
          "/programari",
          "/clienti",
          "/vehicule",
          "/angajati",
          "/setari",
          "/rapoarte",
          "/remindere",
          "/smart-page",
          "/onboarding",
          "/login",
        ],
      },
    ],
    sitemap: "https://velos.ro/sitemap.xml",
  };
}
