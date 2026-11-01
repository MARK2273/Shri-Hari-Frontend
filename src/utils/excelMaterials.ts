import * as XLSX from 'xlsx';
import { Material, Supplier } from '../types';

export interface ParsedBatchRow {
  id: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  rawMaterialInput: string;
  supplierId: string | null;
  supplierName: string;
  receivedQuantityKg: number;
  costPerKg: number;
  supplierLotNumber: string;
  receiptDate: string;
  batchNumber: string;
  notes: string;
  isValid: boolean;
  errors: string[];
}

export interface ParseExcelResult {
  fileName: string;
  rows: ParsedBatchRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalQuantityKg: number;
  totalValueInr: number;
}

/**
 * Generates and downloads an Excel template pre-populated with actual materials and vendors
 * from the user's active database, complete with instructions on what to fill and what not to fill.
 */
export const downloadRawMaterialTemplate = (
  materials: Material[] = [],
  suppliers: Supplier[] = []
) => {
  const wb = XLSX.utils.book_new();
  const todayStr = new Date().toISOString().split('T')[0];

  // Default vendor name to use for pre-population
  const primaryVendorName = suppliers[0]?.name || 'Reliance Industries Ltd';

  // -------------------------------------------------------------
  // Sheet 1: Inward Raw Materials (Fill Data Here)
  // -------------------------------------------------------------
  // Only headers — user fills in all data manually
  const inwardHeaders = [
    'Vendor Name * [REQUIRED]',
    'Material Code * [REQUIRED]',
    'Material Name [AUTO-MAPPED]',
    'Received Quantity in kg * [FILL NUMBER]',
    'Rate per kg in INR * [FILL NUMBER]',
    'Supplier Invoice / Lot No [RECOMMENDED]',
    'Receipt Date (YYYY-MM-DD) [OPTIONAL]',
    'Internal Batch No [DO NOT FILL - AUTO GENERATED]',
    'Notes / Remarks [OPTIONAL]',
  ];

  const wsInward = XLSX.utils.aoa_to_sheet([inwardHeaders]);

  wsInward['!cols'] = [
    { wch: 32 }, // Vendor Name
    { wch: 26 }, // Material Code
    { wch: 35 }, // Material Name
    { wch: 36 }, // Received Quantity in kg
    { wch: 32 }, // Rate per kg in INR
    { wch: 36 }, // Supplier Invoice / Lot No
    { wch: 32 }, // Receipt Date
    { wch: 42 }, // Internal Batch No
    { wch: 40 }, // Notes / Remarks
  ];

  XLSX.utils.book_append_sheet(wb, wsInward, 'Inward Raw Materials');

  // -------------------------------------------------------------
  // Sheet 2: What to Fill & What NOT to Fill (Field Guide)
  // -------------------------------------------------------------
  const guideData = [
    ['SHRI HARI PACKAGING - RAW MATERIAL IMPORT FIELD INSTRUCTIONS'],
    ['QUICK SUMMARY: Fill only the columns marked REQUIRED for each material received. Empty quantity rows will be ignored automatically.'],
    [''],
    ['Column / Field Name', 'Required Status', 'WHAT TO FILL', 'WHAT NOT TO FILL / LEAVE BLANK', 'Accepted Format & Example'],
    [
      'Vendor Name *',
      'MANDATORY',
      "Copy exact Vendor Name from 'Available Vendors' sheet (or enter new vendor name).",
      'Do not leave empty. Do not invent non-existent vendor codes.',
      suppliers[0]?.name || 'Reliance Industries Ltd',
    ],
    [
      'Material Code *',
      'MANDATORY (Key)',
      "Copy exact Material Code from 'Available Materials' sheet (e.g. MAT-1080). Matches directly with database.",
      'Do not leave empty. Do not invent non-existent codes.',
      materials[0]?.code || 'MAT-1080',
    ],
    [
      'Material Name',
      'REFERENCE ONLY',
      'Description of the material. Pre-filled automatically to help you identify the plastic polymer.',
      'Can be left as pre-filled or blank. Material Code is the primary database key.',
      materials[0]?.name || 'METLOCINE - SLIP',
    ],
    [
      'Received Quantity in kg *',
      'MANDATORY',
      'Enter the net weight in kilograms as numbers only (e.g. 1000 or 2500.5).',
      'DO NOT type units like "kg", "kgs", "tons" or commas. Enter numbers only!',
      '1500 (or 2500.5)',
    ],
    [
      'Rate per kg in INR *',
      'MANDATORY',
      'Enter the purchase price per kg in Indian Rupees (e.g. 112.50).',
      'DO NOT type "Rs.", "₹", or commas. Enter numbers only!',
      '112.50',
    ],
    [
      'Supplier Invoice / Lot No',
      'RECOMMENDED',
      'Vendor invoice number, challan number, or manufacturer batch lot number.',
      'If not available on delivery, can be left blank.',
      'INV-REL-2026-904',
    ],
    [
      'Receipt Date (YYYY-MM-DD)',
      'OPTIONAL',
      'Inward arrival date in YYYY-MM-DD format (e.g. 2026-11-01).',
      'If left blank, today\'s date will automatically be assigned by the ERP.',
      todayStr,
    ],
    [
      'Internal Batch No',
      'DO NOT FILL',
      'LEAVE THIS COLUMN COMPLETELY BLANK.',
      'DO NOT FILL. The ERP automatically generates unique traceable batch numbers like MB-20261101-101.',
      '(Leave Blank)',
    ],
    [
      'Notes / Remarks',
      'OPTIONAL',
      'Any inspection notes, packaging type, bag count, or warehouse rack notes.',
      'Can be left blank.',
      'Virgin polymer, 25kg sealed bags',
    ],
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 50 },
    { wch: 45 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'What to Fill & What NOT');

  // -------------------------------------------------------------
  // Sheet 3: Available Materials in Database (Copy-Paste List)
  // -------------------------------------------------------------
  const matSheetData = [
    ['CURRENT PLASTIC MATERIALS IN DATABASE (Copy & Paste Code or Name to Inward Sheet)'],
    [''],
    ['Material Code (Copy This)', 'Material Name', 'Standard Unit', 'Current In-Stock (kg)', 'Min Stock Level (kg)', 'How to Use in Template'],
  ];

  if (materials.length > 0) {
    materials.forEach((m) => {
      matSheetData.push([
        m.code,
        m.name,
        m.standard_unit || 'kg',
        String(m.total_stock_kg ?? 0),
        String(m.min_stock_level_kg ?? 100),
        'Copy Code to Column B of Inward Sheet',
      ]);
    });
  } else {
    matSheetData.push(['No materials found in database yet. Please configure materials in ERP.']);
  }

  const wsMat = XLSX.utils.aoa_to_sheet(matSheetData);
  wsMat['!cols'] = [
    { wch: 28 },
    { wch: 40 },
    { wch: 18 },
    { wch: 24 },
    { wch: 22 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMat, 'Available Materials');

  // -------------------------------------------------------------
  // Sheet 4: Available Vendors in Database (Copy-Paste List)
  // -------------------------------------------------------------
  const supSheetData = [
    ['CURRENT REGISTERED VENDORS / SUPPLIERS IN DATABASE (Copy Name to Inward Sheet)'],
    [''],
    ['Vendor Name (Copy This)', 'Vendor Code', 'Contact Person', 'Phone Number', 'How to Use in Template'],
  ];

  if (suppliers.length > 0) {
    suppliers.forEach((s) => {
      supSheetData.push([
        s.name,
        s.code || '',
        s.contact_person || '',
        s.phone || '',
        'Copy Name to Column A of Inward Sheet',
      ]);
    });
  } else {
    supSheetData.push(['No suppliers registered yet. You can type any new vendor name and ERP will auto-register it.']);
  }

  const wsSup = XLSX.utils.aoa_to_sheet(supSheetData);
  wsSup['!cols'] = [
    { wch: 35 },
    { wch: 22 },
    { wch: 28 },
    { wch: 24 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSup, 'Available Vendors');

  // Generate & trigger browser download
  XLSX.writeFile(wb, 'Vendor_Raw_Material_Inward_Template.xlsx');
};

/**
 * Normalizes string keys for flexible header matching
 */
const normalizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * Formats a date value (string, Excel serial number, or Date) to YYYY-MM-DD
 */
const formatToIsoDate = (value: any): string => {
  const today = new Date().toISOString().split('T')[0];
  if (!value) return today;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'number') {
    // Excel serial date calculation
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  const str = String(value).trim();
  if (!str) return today;

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return today;
};

/**
 * Parses numeric inputs (strips currency symbols, commas, units like kg)
 */
const parseCleanNumber = (value: any): number => {
  if (typeof value === 'number') return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const cleaned = String(value)
    .replace(/[₹$,]/g, '')
    .replace(/kg/gi, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Matches a material string to existing materials by code, exact name, or partial name
 */
export const matchMaterial = (
  rawText: string,
  materials: Material[]
): Material | null => {
  if (!rawText || materials.length === 0) return null;
  const clean = rawText.trim().toLowerCase();

  // 1. Exact match by code
  const codeMatch = materials.find((m) => m.code.toLowerCase() === clean);
  if (codeMatch) return codeMatch;

  // 2. Exact match by name
  const nameMatch = materials.find((m) => m.name.toLowerCase() === clean);
  if (nameMatch) return nameMatch;

  // 3. Match code inside rawText (e.g. "MAT-1080 METLOCINE" matches "MAT-1080")
  const subCodeMatch = materials.find((m) => clean.includes(m.code.toLowerCase()));
  if (subCodeMatch) return subCodeMatch;

  // 4. Keyword fuzzy match
  const keywords = ['hdpe', 'ldpe', 'pp', 'lldpe', 'masterbatch', 'bopp', 'metlocine', 'filler', 'slip', 'white'];
  for (const kw of keywords) {
    if (clean.includes(kw)) {
      const kwMatch = materials.find(
        (m) =>
          m.code.toLowerCase().includes(kw) ||
          m.name.toLowerCase().includes(kw)
      );
      if (kwMatch) return kwMatch;
    }
  }

  // 5. Partial name substring
  const subNameMatch = materials.find(
    (m) => clean.includes(m.name.toLowerCase()) || m.name.toLowerCase().includes(clean)
  );
  if (subNameMatch) return subNameMatch;

  return null;
};

/**
 * Matches a supplier string to existing suppliers
 */
export const matchSupplier = (
  rawText: string,
  suppliers: Supplier[]
): Supplier | null => {
  if (!rawText || suppliers.length === 0) return null;
  const clean = rawText.trim().toLowerCase();

  const exactMatch = suppliers.find(
    (s) =>
      s.name.toLowerCase() === clean ||
      (s.code && s.code.toLowerCase() === clean)
  );
  if (exactMatch) return exactMatch;

  const partialMatch = suppliers.find(
    (s) =>
      clean.includes(s.name.toLowerCase()) ||
      s.name.toLowerCase().includes(clean)
  );
  return partialMatch || null;
};

/**
 * Parses an uploaded Excel file (.xlsx, .xls, .csv) and returns structured batch rows
 */
export const parseRawMaterialExcelFile = async (
  file: File,
  materials: Material[],
  suppliers: Supplier[]
): Promise<ParseExcelResult> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Priority search for the Inward data sheet
  let sheetName = '';
  for (const name of workbook.SheetNames) {
    const lower = name.trim().toLowerCase();
    if (lower.includes('inward') || lower.includes('raw material') || lower.includes('fill here')) {
      sheetName = name;
      break;
    }
  }

  if (!sheetName) {
    // Pick the first sheet that is NOT an instruction/reference sheet
    for (const name of workbook.SheetNames) {
      const lower = name.trim().toLowerCase();
      if (!lower.includes('what to fill') && !lower.includes('available') && !lower.includes('guide') && !lower.includes('reference')) {
        sheetName = name;
        break;
      }
    }
  }

  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new Error('No readable data sheet found in the uploaded workbook.');
  }

  // Convert sheet to array of rows to reliably detect header row
  const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
  });

  if (!rawMatrix || rawMatrix.length === 0) {
    throw new Error('The uploaded Excel sheet is empty.');
  }

  // Locate the header row index (scanning first 8 rows)
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(rawMatrix.length, 8); r++) {
    const row = rawMatrix[r];
    if (!Array.isArray(row)) continue;
    const rowStr = row.map((cell) => normalizeKey(String(cell))).join(' ');
    // Looking for key indicators
    if (
      (rowStr.includes('material') || rowStr.includes('polymer') || rowStr.includes('item') || rowStr.includes('code')) &&
      (rowStr.includes('quant') || rowStr.includes('qty') || rowStr.includes('weight') || rowStr.includes('kg') || rowStr.includes('rate'))
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Fallback to first non-empty row
    for (let r = 0; r < rawMatrix.length; r++) {
      if (rawMatrix[r] && rawMatrix[r].some((c) => String(c).trim() !== '')) {
        headerRowIndex = r;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Unable to identify column headers in the uploaded file. Please use the provided template.');
  }

  const headers = rawMatrix[headerRowIndex].map((h) => String(h || '').trim());

  // Map header index by normalized keywords
  let colVendor = -1;
  let colMaterialCode = -1;
  let colMaterialName = -1;
  let colMaterialGeneric = -1;
  let colQty = -1;
  let colRate = -1;
  let colLot = -1;
  let colDate = -1;
  let colBatch = -1;
  let colNotes = -1;

  headers.forEach((h, idx) => {
    const n = normalizeKey(h);
    if (!n) return;

    if (colVendor === -1 && (n.includes('vendor') || n.includes('supplier') || n.includes('party'))) {
      colVendor = idx;
    } else if (
      colMaterialCode === -1 &&
      (n.includes('materialcode') || n.includes('itemcode') || (n.includes('material') && n.includes('code')))
    ) {
      colMaterialCode = idx;
    } else if (
      colMaterialName === -1 &&
      (n.includes('materialname') || n.includes('itemname') || (n.includes('material') && n.includes('name')))
    ) {
      colMaterialName = idx;
    } else if (
      colMaterialGeneric === -1 &&
      (n.includes('material') || n.includes('plastic') || n.includes('polymer') || n.includes('item'))
    ) {
      colMaterialGeneric = idx;
    } else if (
      colQty === -1 &&
      (n.includes('quant') || n.includes('qty') || n.includes('weight') || n.includes('kg'))
    ) {
      colQty = idx;
    } else if (
      colRate === -1 &&
      (n.includes('rate') || n.includes('cost') || n.includes('price') || n.includes('inr'))
    ) {
      colRate = idx;
    } else if (
      colLot === -1 &&
      (n.includes('lot') || n.includes('invoice') || n.includes('challan') || n.includes('bill'))
    ) {
      colLot = idx;
    } else if (colDate === -1 && (n.includes('date') || n.includes('receipt') || n.includes('inward'))) {
      colDate = idx;
    } else if (colBatch === -1 && (n.includes('batch') || n.includes('lotno'))) {
      colBatch = idx;
    } else if (colNotes === -1 && (n.includes('note') || n.includes('remark') || n.includes('desc'))) {
      colNotes = idx;
    }
  });

  // Default positions fallback if columns are in standard order
  if (colMaterialCode === -1 && colMaterialGeneric === -1 && headers.length >= 2) colMaterialCode = 1;
  if (colQty === -1 && headers.length >= 4) colQty = 3;
  if (colRate === -1 && headers.length >= 5) colRate = 4;
  if (colVendor === -1 && headers.length >= 1) colVendor = 0;

  const parsedRows: ParsedBatchRow[] = [];
  const todayCompact = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  for (let r = headerRowIndex + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || !Array.isArray(row)) continue;

    // Skip row if completely empty
    const isRowEmpty = row.every((c) => String(c ?? '').trim() === '');
    if (isRowEmpty) continue;

    const rawVendor = colVendor !== -1 ? String(row[colVendor] ?? '').trim() : '';
    const rawCode = colMaterialCode !== -1 ? String(row[colMaterialCode] ?? '').trim() : '';
    const rawName = colMaterialName !== -1 ? String(row[colMaterialName] ?? '').trim() : '';
    const rawGeneric = colMaterialGeneric !== -1 ? String(row[colMaterialGeneric] ?? '').trim() : '';

    const rawQty = colQty !== -1 ? row[colQty] : '';
    const rawRate = colRate !== -1 ? row[colRate] : '';
    const rawLot = colLot !== -1 ? String(row[colLot] ?? '').trim() : '';
    const rawDate = colDate !== -1 ? row[colDate] : '';
    const rawBatch = colBatch !== -1 ? String(row[colBatch] ?? '').trim() : '';
    const rawNotes = colNotes !== -1 ? String(row[colNotes] ?? '').trim() : '';

    // Check if user filled quantity or rate for this row
    const qtyClean = parseCleanNumber(rawQty);
    const rateClean = parseCleanNumber(rawRate);

    const hasQtyValue = String(rawQty ?? '').trim() !== '';
    const hasRateValue = String(rawRate ?? '').trim() !== '';

    // If this row has material pre-filled but user left quantity & rate empty, SKIP it gracefully
    if (!hasQtyValue && !hasRateValue) {
      continue;
    }

    // Material resolution: prioritize exact material code, then name, then generic string
    let matchedMat: Material | null = null;
    let chosenRawInput = rawCode || rawName || rawGeneric;

    if (rawCode) {
      matchedMat = matchMaterial(rawCode, materials);
    }
    if (!matchedMat && rawName) {
      matchedMat = matchMaterial(rawName, materials);
    }
    if (!matchedMat && rawGeneric) {
      matchedMat = matchMaterial(rawGeneric, materials);
    }

    const matchedSup = matchSupplier(rawVendor, suppliers);
    const isoDate = formatToIsoDate(rawDate);

    const errors: string[] = [];
    if (!matchedMat) {
      errors.push(chosenRawInput ? `Unrecognized material: "${chosenRawInput}". Please select matching material.` : 'Material code/name is required');
    }
    if (qtyClean <= 0) {
      errors.push('Quantity (kg) must be greater than 0');
    }
    if (rateClean <= 0) {
      errors.push('Rate per kg must be greater than 0');
    }

    const autoBatchNum = rawBatch || `MB-${todayCompact}-${Math.floor(Math.random() * 900 + 100)}`;

    parsedRows.push({
      id: Math.random().toString(36).substring(2, 11),
      materialId: matchedMat?.id || (materials.length > 0 ? materials[0].id : ''),
      materialName: matchedMat?.name || rawName || chosenRawInput || 'Unknown Material',
      materialCode: matchedMat?.code || rawCode || '',
      rawMaterialInput: chosenRawInput,
      supplierId: matchedSup?.id || null,
      supplierName: matchedSup?.name || rawVendor || (suppliers[0]?.name || ''),
      receivedQuantityKg: qtyClean,
      costPerKg: rateClean,
      supplierLotNumber: rawLot,
      receiptDate: isoDate,
      batchNumber: autoBatchNum,
      notes: rawNotes,
      isValid: errors.length === 0,
      errors,
    });
  }

  if (parsedRows.length === 0) {
    throw new Error(
      'No filled rows found. Please enter Received Quantity and Rate for at least one material in the "Inward Raw Materials" sheet.'
    );
  }

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;
  const totalKg = parsedRows.reduce((acc, r) => acc + (Number(r.receivedQuantityKg) || 0), 0);
  const totalVal = parsedRows.reduce((acc, r) => acc + (Number(r.receivedQuantityKg) || 0) * (Number(r.costPerKg) || 0), 0);

  return {
    fileName: file.name,
    rows: parsedRows,
    totalRows: parsedRows.length,
    validRows: validCount,
    invalidRows: invalidCount,
    totalQuantityKg: Math.round(totalKg * 100) / 100,
    totalValueInr: Math.round(totalVal * 100) / 100,
  };
};
