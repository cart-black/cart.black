import { Hono } from "hono";
import { renderHTMLTemplate } from "../../lib/html.js";
import { honoTypes } from "../../index.js";
import path from "path";
import { fileURLToPath } from "url";

console.log("import.meta.url");
console.log(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const mainRouter = new Hono<honoTypes>()
	.get("/", async (c) => {
		const user = c.get("user");
		// if (!user) {
		// 	return c.redirect("/login");
		// }

		// how to get the absolute path to the template?
		const templatePath = path.join(__dirname, "index.template.html");

		const html = await renderHTMLTemplate(templatePath, {
			username: user?.username,
			user_id: user?.id
		});
		return c.html(html, 200);
	});
