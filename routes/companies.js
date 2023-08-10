const express = require("express");

const db = require("../db");
const router = new express.Router();
const { NotFoundError, BadRequestError } = require("../expressError");
// const { NotFoundError, BadRequestError } = require("../expressError");

console.log('NotFoundError=', NotFoundError);
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

  if (!company) {
    throw new NotFoundError();
  }

  return res.json({ company });
});


/** POST /companies/: adds a company
 *
 *  Needs to be given JSON like: {code, name, description}
 *
 *  Returns obj of new company: {company: {code, name, description}}
*/

router.post("/", async function (req, res, next) {

  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;

  const cResult = await db.query(
    `INSERT INTO companies (code, name, description)
        VALUES ($1, $2, $3)
        RETURNING code, name, description`,
    [code, name, description]);

  console.log(`cResult: ${cResult}`);

  const company = cResult.rows[0];
  console.log(`company: ${cResult.rows[0]}`);


  return res.status(201).json({ company });
});




/** DELETE /companies/[id]: delete user, return {message: Deleted} */
router.delete("/:id", function (req, res) {
  db.User.delete(req.params.id);
  return res.json({ message: "Deleted" });
});

module.exports = router;