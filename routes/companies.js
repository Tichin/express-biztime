const express = require("express");

const db = require("../db");
const router = new express.Router();
const { NotFoundError, BadRequestError } = require("../expressError");


/** GET /companies: get list of companies
 *
 *  like {companies: [{code, name}, ...]}
*/
router.get("/", async function (req, res, next) {

  const cResults = await db.query(
    `SELECT code, name
        FROM companies`);

  const companies = cResults.rows;

  return res.json({ companies });
});


/** GET /companies/:code: get a company
 *
 *  Return obj of company: {company: {code, name, description}}
*/
router.get("/:code", async function (req, res, next) {

  if (!req.body) throw new BadRequestError();
  const code = req.params.code;
  console.log(`code: ${code}`);
  const cResult = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code=$1`, [code]);

  console.log(`cResult: ${cResult}`);
  const company = cResult.rows[0];
  console.log(`company: ${cResult.rows[0]}`);

  if (company === undefined) {
    throw new NotFoundError("Company not found");
  }

  return res.json({ company });
});




/** DELETE /companies/[id]: delete user, return {message: Deleted} */
router.delete("/:id", function (req, res) {
  db.User.delete(req.params.id);
  return res.json({ message: "Deleted" });
});

module.exports = router;