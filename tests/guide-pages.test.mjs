import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const what = readFileSync("pages/what-we-do.html", "utf8");
const why = readFileSync("pages/why-compass.html", "utf8");
const index = readFileSync("index.html", "utf8");
const sitemap = readFileSync("pages/sitemap.html", "utf8");

describe("What We Do and Why Compass", () => {
  it("keeps the graphic wording and contact details", () => {
    expect(what).toContain("Guiding people. Connecting opportunities. Creating better futures.");
    expect(what).toContain("We help people find their way to a brighter future.");
    for (const step of ["Understand", "Engage", "Support", "Progress", "Succeed"]) {
      expect(what).toContain(`<h3>${step}</h3>`);
    }
    expect(what).toContain("We believe in potential.");
    expect(what).toContain("mailto:enquiries@compassconsultes.co.uk");
    expect(what).toContain("tel:+447936327832");
    expect(why).toContain("Why <span class=\"guide-gradient\">Compass</span>?");
    expect(why).toContain("Specialist expertise. Independent insight. Stronger system outcomes.");
    expect(why).toContain("Delivering value for employers, partners and communities");
    for (const title of [
      "Extensive sector experience",
      "Employer engagement expertise",
      "Understanding of local authority environments",
      "Knowledge of policy",
      "Multi-stakeholder collaboration",
      "Independent perspective",
      "System development focus",
      "Flexible and scalable capacity"
    ]) {
      expect(why).toContain(`<h3>${title}</h3>`);
    }
    expect(what).not.toContain("qr");
    expect(why).not.toContain("qr");
  });

  it("adds both pages to the main navigation and sitemap", () => {
    expect(index).toContain('id="home-guide-heading"');
    expect(index).toContain('href="/pages/what-we-do.html" class="home-guide-card');
    expect(index).toContain('href="/pages/why-compass.html" class="home-guide-card');
    expect(sitemap).toContain('href="/pages/what-we-do.html"');
    expect(sitemap).toContain('href="/pages/why-compass.html"');
    expect(readFileSync("sitemap.xml", "utf8")).toContain("https://compassconsultes.co.uk/pages/what-we-do");
    expect(readFileSync("sitemap.xml", "utf8")).toContain("https://compassconsultes.co.uk/pages/why-compass");
    expect(what).toContain('aria-current="page"');
    expect(why).toContain('aria-current="page"');
  });

  it("lists both pages in every footer Quick Links block", () => {
    const files = [
      ...readdirSync(".").filter((name) => name.endsWith(".html")),
      ...readdirSync("pages").filter((name) => name.endsWith(".html")).map((name) => join("pages", name))
    ];
    const withFooter = files.filter((file) => readFileSync(file, "utf8").includes("Quick Links"));
    expect(withFooter.length).toBeGreaterThan(20);
    for (const file of withFooter) {
      const footer = readFileSync(file, "utf8").slice(readFileSync(file, "utf8").toLowerCase().lastIndexOf("<footer"));
      const quick = footer.slice(footer.indexOf("Quick Links"));
      expect(quick, file).toContain('href="/pages/what-we-do.html"');
      expect(quick, file).toContain('href="/pages/why-compass.html"');
    }
  });
});
