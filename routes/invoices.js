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

/** GET /invoices - get list of invoices for given company //All the invoices
 *
 *  like {invoices: [{id, comp_code}, ...]}
*/

router.get("/", async function (req, res, next) {
  console.log('got in /invoices');
  const iResults = await db.query(
    `SELECT id, comp_code
        FROM invoices
        ORDER BY id`);

  console.log('iResults=', iResults);
  const invoices = iResults.rows;
  console.log('invoices=', invoices);


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
  // no comp_code here
  const invoice = iResult.rows[0];

  if (!invoice) {
    throw new NotFoundError(`Invoice not found `); // put id as well
  }

  const cResult = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code=$1`, [invoice.comp_code]);

  const company = cResult.rows[0];

  // if (!company) {
  //   throw new NotFoundError(`Company not found`);
  // }

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


/** PUT /invoices/:id - updates existing invoice
 *
 *  Needs to be given JSON like: { amt }
 *
 *  Returns updated invoice object:
 *       {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 *  or throws 404 error if not found
*/

router.put("/:id", async function (req, res, next) {

  if (!req.body) throw new BadRequestError();

  const { amt } = req.body;

  const iResult = await db.query(
    `UPDATE invoices
        SET amt=$1
        WHERE id=$2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, req.params.id]);

  const invoice = iResult.rows[0];

  if (!invoice) {
    throw new NotFoundError();
  }

  return res.status(200).json({ invoice });
});


/** DELETE /invoices/:id - deletes an invoice,
 *  return {status: "deleted"}
 *  or throws 404 if invoice not found */

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;

  const iResult = await db.query(
    `DELETE from invoices WHERE id = $1
        RETURNING id`,
    [id],
  );

  const invoice = iResult.rows[0];
  if (!invoice) {
    throw new NotFoundError();
  }

  return res.json({ status: "deleted" });
});


module.exports = router;