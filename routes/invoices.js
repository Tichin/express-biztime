const express = require("express");

const db = require("../db");
const router = new express.Router();
const { NotFoundError, BadRequestError } = require("../expressError");

// CREATE TABLE invoices (
//   id SERIAL PRIMARY KEY,
//   comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
//   amt NUMERIC(10, 2) NOT NULL CHECK (amt >= 0),
//   paid BOOLEAN DEFAULT FALSE NOT NULL,
//   add_date  DATE DEFAULT CURRENT_DATE NOT NULL,
//   paid_date DATE
// );

/** GET /invoices - get list of invoices for given company
 *
 *  like {invoices: [{id, comp_code}, ...]}
*/

router.get("/", async function (req, res, next) {

  const iResults = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY comp_code`);

  const invoices = iResults.rows;

  return res.json({ invoices });
});


/** GET /invoices/:id - get an invoice
 *
 *  Return obj of invoice:
 *  {invoice:
 *    {id, amt, paid, add_date, paid_date,
 *      company:
 *        {code, name, description}
 *    }
 *  }
*/

router.get("/:id", async function (req, res, next) {
  const id = req.params.id;

  const iResult = await db.query(
    `SELECT id, amt, comp_code, paid, add_date, paid_date
        FROM invoices
        WHERE id=$1`, [id]);
  const invoice = iResult.rows[0];
  console.log(invoice.comp_code);

  const cResult = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code=$1`, [invoice.comp_code]);
  console.log(cResult);

  const company = cResult.rows[0];

  if (!company) {
    throw new NotFoundError();
  }

  invoice.company = company;
  return res.json({ invoice });
});


/** POST /invoices - adds an invoice
 *
 *  Needs to be given JSON like: {comp_code, amt}
 *
 *  Returns obj of new invoice:
 *  {invoice:
 *    {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.post("/", async function (req, res, next) {

  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;

  const iResult = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]);

  const invoice = iResult.rows[0];

  return res.status(201).json({ invoice });
});


// /** PUT /companies/:code - edits existing company
//  *
//  *  Needs to be given JSON like: {name, description}
//  *
//  *  Returns updated company object: {company: {code, name, description}}
//  *  or throws 404 error if not found
// */

// router.put("/:code", async function (req, res, next) {

//   if (!req.body) throw new BadRequestError();

//   const { name, description } = req.body;

//   const cResult = await db.query(
//     `UPDATE companies
//         SET name=$1,
//             description=$2
//         WHERE code=$3
//         RETURNING code, name, description`,
//     [name, description, req.params.code]);

//   const company = cResult.rows[0];

//   if (!company) {
//     throw new NotFoundError();
//   }

//   return res.status(200).json({ company });
// });


// /** DELETE /companies/:code - deletes company,
//  *  return {status: "deleted"}
//  *  or throws 404 if company not found */

// router.delete("/:code", async function (req, res, next) {
//   const code = req.params.code;

//   const result = await db.query(
//     `DELETE from companies WHERE code = $1
//         RETURNING code, name, description`,
//     [code],
//   );

//   if (!result.rows[0]) {
//     throw new NotFoundError();
//   }

//   return res.json({ status: "deleted" });
// });


module.exports = router;