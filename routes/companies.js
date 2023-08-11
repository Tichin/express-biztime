const express = require("express");

const db = require("../db");
const router = new express.Router();
const { NotFoundError, BadRequestError } = require("../expressError");

/** GET /companies - get list of companies
 *
 *  like {companies: [{code, name}, ...]}
*/

router.get("/", async function (req, res, next) {

  const cResults = await db.query(
    `SELECT code, name
        FROM companies
        ORDER BY code`);

  const companies = cResults.rows;

  return res.json({ companies });
});


/** GET /companies/:code - get a company
 *
 *  Return obj of company: {company: {code, name, description,
 *  invoices: [{
        "id": 2,
        "comp_code": "apple",
        "amt": "200.00",
        "paid": false,
        "add_date": "2023-08-10T07:00:00.000Z",
        "paid_date": null
      },{id,...}]
    }
*/

router.get("/:code", async function (req, res, next) {

  const code = req.params.code;
  const cResult = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code=$1`, [code]);

  const company = cResult.rows[0];

  if (!company) {
    throw new NotFoundError();
  }

  const iResult = await db.query(
    `SELECT  id, comp_code, amt, paid, add_date, paid_date
        FROM invoices
        WHERE comp_code = $1`, [code]
  );

  const invoices = iResult.rows;
  console.log('invoice=', invoices);

  company.invoices = invoices; // just id using map

  return res.json({ company });
});


/** POST /companies - adds a company
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

  const company = cResult.rows[0];

  return res.status(201).json({ company });
});


/** PUT /companies/:code - edits existing company
 *
 *  Needs to be given JSON like: {name, description}
 *
 *  Returns updated company object: {company: {code, name, description}}
 *  or throws 404 error if not found
*/

router.put("/:code", async function (req, res, next) {

  if (!req.body) throw new BadRequestError();

  const { name, description } = req.body;

  const cResult = await db.query(
    `UPDATE companies
        SET name=$1,
            description=$2
        WHERE code=$3
        RETURNING code, name, description`,
    [name, description, req.params.code]);

  const company = cResult.rows[0];

  if (!company) {
    throw new NotFoundError();
  }

  return res.status(200).json({ company });
});


/** DELETE /companies/:code - deletes company,
 *  return {status: "deleted"}
 *  or throws 404 if company not found */

router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;


  const cResult = await db.query(
    `DELETE from companies WHERE code = $1
        RETURNING code, name, description`,
    [code],
  );

  const company = cResult.rows[0];
  if (!company) {
    throw new NotFoundError();
  }

  return res.json({ status: "deleted" });
});


module.exports = router;