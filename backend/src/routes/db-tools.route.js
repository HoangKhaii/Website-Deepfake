const express = require('express');
const {
  dbTime,
  listTables,
  describeTableSchema,
  sampleTableRows,
} = require('../controllers/db-tools.controller');

const router = express.Router();

router.get('/db/time', dbTime);
router.get('/db/tables', listTables);
router.get('/db/table/:table/schema', describeTableSchema);
router.get('/db/table/:table/sample', sampleTableRows);

module.exports = router;

