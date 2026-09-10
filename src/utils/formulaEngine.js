import { parseDateValue, formatDate } from './formatters.js';
import { formulaFunctionsCatalog } from './formulaCatalog.js';

export { formulaFunctionsCatalog };

/**
 * Trích xuất giá trị trường an toàn từ bản ghi phẳng
 */
export const getRecordFieldValue = (record, fieldKey) => {
  if (!record || !fieldKey) return undefined;
  if (record[fieldKey] !== undefined && record[fieldKey] !== null) {
    return record[fieldKey];
  }
  let cd = record.custom_data;
  if (typeof cd === 'string') {
    try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
  }
  if (cd && cd[fieldKey] !== undefined && cd[fieldKey] !== null) {
    return cd[fieldKey];
  }
  return undefined;
};

/**
 * Trình phân tích & Đánh giá biểu thức (Safe Recursive Evaluator)
 */
export class FormulaEvaluator {
  constructor(context = {}, fieldResolver = null) {
    this.context = context; // Map key-value { [fieldId]: value, [fieldLabel]: value }
    this.fieldResolver = fieldResolver; // Function (fieldName) => value
  }

  /**
   * Đánh giá biểu thức
   */
  evaluate(expression) {
    if (!expression || typeof expression !== 'string' || !expression.trim()) {
      return '';
    }

    try {
      // 1. Tokenize biểu thức
      const tokens = this.tokenize(expression);
      // 2. Parse thành cú pháp và tính toán
      const result = this.parseExpression(tokens);
      if (result instanceof Date) {
        return formatDate(result);
      }
      return result !== undefined && result !== null ? result : '';
    } catch (err) {
      console.warn('Formula evaluation error:', err.message, 'in expression:', expression);
      return `#LỖI: ${err.message}`;
    }
  }

  tokenize(input) {
    const tokens = [];
    let i = 0;
    const len = input.length;

    while (i < len) {
      const ch = input[i];

      // Bỏ qua khoảng trắng
      if (/\s/.test(ch)) {
        i++;
        continue;
      }

      // Chuỗi ký tự đặt trong dấu ngoặc kép hoặc ngoặc đơn: "..." hoặc '...'
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let strVal = '';
        i++;
        while (i < len && input[i] !== quote) {
          if (input[i] === '\\' && i + 1 < len) {
            i++;
            strVal += input[i];
          } else {
            strVal += input[i];
          }
          i++;
        }
        i++; // Bỏ dấu đóng ngoặc kép
        tokens.push({ type: 'STRING', value: strVal });
        continue;
      }

      // Trường dữ liệu đặt trong dấu ngoặc nhọn: {ten_cot}
      if (ch === '{') {
        let fieldName = '';
        i++;
        while (i < len && input[i] !== '}') {
          fieldName += input[i];
          i++;
        }
        i++; // Bỏ dấu '}'
        tokens.push({ type: 'FIELD', value: fieldName.trim() });
        continue;
      }

      // Số (Number): 123, 123.45
      if (/[0-9]/.test(ch)) {
        let numStr = '';
        while (i < len && /[0-9.]/.test(input[i])) {
          numStr += input[i];
          i++;
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      // Toán tử 2 ký tự: >=, <=, !=, ==, &&, ||
      const twoChar = input.slice(i, i + 2);
      if (['>=', '<=', '!=', '==', '&&', '||'].includes(twoChar)) {
        tokens.push({ type: 'OPERATOR', value: twoChar });
        i += 2;
        continue;
      }

      // Toán tử 1 ký tự: +, -, *, /, %, >, <, =, &, !
      if (['+', '-', '*', '/', '%', '>', '<', '=', '&', '!'].includes(ch)) {
        tokens.push({ type: 'OPERATOR', value: ch === '=' ? '==' : ch });
        i++;
        continue;
      }

      // Dấu phân tách & Ngoặc: (, ), ,
      if (ch === '(' || ch === ')' || ch === ',') {
        tokens.push({ type: ch, value: ch });
        i++;
        continue;
      }

      // Tên hàm hoặc định danh: IF, DATEDIF, TRUE, FALSE...
      if (/[a-zA-Z_À-ỹ]/.test(ch)) {
        let ident = '';
        while (i < len && /[a-zA-Z0-9_À-ỹ]/.test(input[i])) {
          ident += input[i];
          i++;
        }
        const upperIdent = ident.toUpperCase();
        if (upperIdent === 'TRUE') {
          tokens.push({ type: 'BOOLEAN', value: true });
        } else if (upperIdent === 'FALSE') {
          tokens.push({ type: 'BOOLEAN', value: false });
        } else if (upperIdent === 'NULL' || upperIdent === 'BLANK') {
          tokens.push({ type: 'NULL', value: null });
        } else {
          tokens.push({ type: 'IDENTIFIER', value: upperIdent });
        }
        continue;
      }

      i++;
    }

    return tokens;
  }

  parseExpression(tokens) {
    let index = 0;

    const peek = () => tokens[index];
    const consume = (expectedType) => {
      const token = tokens[index++];
      if (!token && expectedType) {
        throw new Error(`Kỳ vọng '${expectedType}' nhưng biểu thức kết thúc bất ngờ.`);
      }
      return token;
    };

    // Parse Binary Expression với độ ưu tiên toán tử
    const parseLogicalOr = () => {
      let left = parseLogicalAnd();
      while (peek() && (peek().value === '||' || peek().value === 'OR')) {
        consume();
        const right = parseLogicalAnd();
        left = Boolean(left) || Boolean(right);
      }
      return left;
    };

    const parseLogicalAnd = () => {
      let left = parseComparison();
      while (peek() && (peek().value === '&&' || peek().value === 'AND')) {
        consume();
        const right = parseComparison();
        left = Boolean(left) && Boolean(right);
      }
      return left;
    };

    const parseComparison = () => {
      let left = parseConcat();
      while (peek() && ['==', '!=', '>', '<', '>=', '<='].includes(peek().value)) {
        const op = consume().value;
        const right = parseConcat();

        // So sánh ngày tháng nếu 1 trong 2 là Date hoặc chuỗi ngày
        const dtL = parseDateValue(left);
        const dtR = parseDateValue(right);
        if (dtL && dtR) {
          const tL = dtL.getTime();
          const tR = dtR.getTime();
          if (op === '==') left = tL === tR;
          else if (op === '!=') left = tL !== tR;
          else if (op === '>') left = tL > tR;
          else if (op === '<') left = tL < tR;
          else if (op === '>=') left = tL >= tR;
          else if (op === '<=') left = tL <= tR;
          continue;
        }

        // So sánh số nếu cả 2 là số
        const nL = typeof left === 'number' ? left : parseFloat(String(left).replace(/[^0-9.-]+/g, ''));
        const nR = typeof right === 'number' ? right : parseFloat(String(right).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(nL) && !isNaN(nR) && typeof left !== 'string' && typeof right !== 'string') {
          if (op === '==') left = nL === nR;
          else if (op === '!=') left = nL !== nR;
          else if (op === '>') left = nL > nR;
          else if (op === '<') left = nL < nR;
          else if (op === '>=') left = nL >= nR;
          else if (op === '<=') left = nL <= nR;
          continue;
        }

        // Xử lý so sánh với trường rỗng/null (trường thiếu dữ liệu hoặc lookup không có kết quả)
        if (left === null && right === null) {
          if (op === '==') left = false;
          else if (op === '!=') left = true;
          else left = false;
          continue;
        }
        if ((left === null && right === '') || (left === '' && right === null)) {
          if (op === '==') left = true;
          else if (op === '!=') left = false;
          else left = false;
          continue;
        }
        if (left === null || right === null) {
          if (op === '==') left = false;
          else if (op === '!=') left = true;
          else left = false;
          continue;
        }

        // So sánh chuỗi mặc định (trim và toLowerCase an toàn)
        const sL = String(left ?? '').trim().toLowerCase();
        const sR = String(right ?? '').trim().toLowerCase();
        if (op === '==') left = sL === sR;
        else if (op === '!=') left = sL !== sR;
        else if (op === '>') left = sL > sR;
        else if (op === '<') left = sL < sR;
        else if (op === '>=') left = sL >= sR;
        else if (op === '<=') left = sL <= sR;
      }
      return left;
    };

    const parseConcat = () => {
      let left = parseAdditive();
      while (peek() && peek().value === '&') {
        consume();
        const right = parseAdditive();
        left = String(left ?? '') + String(right ?? '');
      }
      return left;
    };

    const parseAdditive = () => {
      let left = parseMultiplicative();
      while (peek() && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = parseMultiplicative();
        const nL = Number(left) || 0;
        const nR = Number(right) || 0;
        left = op === '+' ? nL + nR : nL - nR;
      }
      return left;
    };

    const parseMultiplicative = () => {
      let left = parseUnary();
      while (peek() && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
        const op = consume().value;
        const right = parseUnary();
        const nL = Number(left) || 0;
        const nR = Number(right) || 0;
        if (op === '*') left = nL * nR;
        else if (op === '/') left = nR !== 0 ? nL / nR : 0;
        else if (op === '%') left = nR !== 0 ? nL % nR : 0;
      }
      return left;
    };

    const parseUnary = () => {
      if (peek() && peek().value === '!') {
        consume();
        return !parseUnary();
      }
      if (peek() && peek().value === '-') {
        consume();
        return -parseUnary();
      }
      return parsePrimary();
    };

    const parsePrimary = () => {
      const token = peek();
      if (!token) return '';

      // Ngoặc đơn (Expression)
      if (token.type === '(') {
        consume('(');
        const expr = parseLogicalOr();
        consume(')');
        return expr;
      }

      // Hằng số nguyên thủy
      if (token.type === 'NUMBER') return consume().value;
      if (token.type === 'STRING') return consume().value;
      if (token.type === 'BOOLEAN') return consume().value;
      if (token.type === 'NULL') { consume(); return ''; }

      // Tham chiếu cột dữ liệu: {ten_cot}
      if (token.type === 'FIELD') {
        const fieldName = consume().value;
        const val = this.context[fieldName] ?? this.context[fieldName.toLowerCase()];
        if (val !== undefined && val !== null && val !== '' && val !== '-') {
          return val;
        }
        if (typeof this.fieldResolver === 'function') {
          if (!this.resolvingFields) this.resolvingFields = new Set();
          const cleanKey = String(fieldName).toLowerCase().trim();
          if (this.resolvingFields.has(cleanKey)) return '';
          this.resolvingFields.add(cleanKey);
          try {
            const res = this.fieldResolver(fieldName);
            if (res !== undefined && res !== null && res !== '' && res !== '-') {
              return res;
            }
          } finally {
            this.resolvingFields.delete(cleanKey);
          }
        }
        return null;
      }

      // Lời gọi Hàm: IF(...), DATEDIF(...)...
      if (token.type === 'IDENTIFIER') {
        const funcName = consume().value;
        if (peek() && peek().type === '(') {
          consume('(');
          const args = [];
          if (peek() && peek().type !== ')') {
            args.push(parseLogicalOr());
            while (peek() && peek().type === ',') {
              consume(',');
              args.push(parseLogicalOr());
            }
          }
          consume(')');
          return this.executeFunction(funcName, args);
        }
        // Nếu không có dấu ngoặc, kiểm tra context trước
        const cVal = this.context[funcName] ?? this.context[funcName.toLowerCase()];
        if (cVal !== undefined && cVal !== null && cVal !== '' && cVal !== '-') {
          return cVal;
        }
        // Sau đó mới kiểm tra fieldResolver kèm chống lặp vô hạn
        if (typeof this.fieldResolver === 'function') {
          if (!this.resolvingFields) this.resolvingFields = new Set();
          const cleanKey = String(funcName).toLowerCase().trim();
          if (this.resolvingFields.has(cleanKey)) return funcName;
          this.resolvingFields.add(cleanKey);
          try {
            const res = this.fieldResolver(funcName);
            if (res !== undefined && res !== null && res !== '' && res !== '-') {
              return res;
            }
          } finally {
            this.resolvingFields.delete(cleanKey);
          }
        }
        return funcName;
      }

      consume();
      return '';
    };

    return parseLogicalOr();
  }

  /**
   * Thực thi các hàm tính toán tích hợp
   */
  executeFunction(name, args) {
    const upper = name.toUpperCase();

    // 1. Logic
    if (upper === 'IF') {
      const cond = Boolean(args[0]);
      return cond ? (args[1] ?? '') : (args[2] ?? '');
    }
    if (upper === 'AND') {
      return args.every(Boolean);
    }
    if (upper === 'OR') {
      return args.some(Boolean);
    }
    if (upper === 'NOT') {
      return !args[0];
    }
    if (upper === 'ISBLANK') {
      const val = args[0];
      return val === undefined || val === null || String(val).trim() === '' || String(val).trim() === '-';
    }
    if (upper === 'BLANK') {
      return '';
    }
    if (upper === 'SWITCH') {
      const expr = args[0];
      for (let i = 1; i < args.length - 1; i += 2) {
        if (String(expr).toLowerCase() === String(args[i]).toLowerCase()) {
          return args[i + 1];
        }
      }
      // Mặc định (default value ở cuối nếu lẻ tham số)
      if (args.length % 2 === 0) {
        return args[args.length - 1];
      }
      return '';
    }

    // 2. Ngày tháng
    if (upper === 'TODAY') {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (upper === 'NOW') {
      return new Date();
    }
    if (upper === 'DATEDIF') {
      const start = parseDateValue(args[0]);
      const end = parseDateValue(args[1]);
      const unit = String(args[2] || 'D').toUpperCase().trim().replace(/['"]/g, '');
      if (!start || !end) return 0;
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (unit === 'Y' || unit === 'YEAR') {
        return end.getFullYear() - start.getFullYear();
      }
      if (unit === 'M' || unit === 'MONTH') {
        return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      }
      return diffDays; // Mặc định 'D' (ngày)
    }
    if (upper === 'DATEADD') {
      const d = parseDateValue(args[0]);
      const num = Number(args[1]) || 0;
      const unit = String(args[2] || 'D').toUpperCase().trim().replace(/['"]/g, '');
      if (!d) return '';
      const res = new Date(d);
      if (unit === 'Y' || unit === 'YEAR') {
        res.setFullYear(res.getFullYear() + num);
      } else if (unit === 'M' || unit === 'MONTH') {
        res.setMonth(res.getMonth() + num);
      } else {
        res.setDate(res.getDate() + num);
      }
      return res;
    }
    if (upper === 'YEAR') {
      const d = parseDateValue(args[0]);
      return d ? d.getFullYear() : '';
    }
    if (upper === 'MONTH') {
      const d = parseDateValue(args[0]);
      return d ? d.getMonth() + 1 : '';
    }
    if (upper === 'DAY') {
      const d = parseDateValue(args[0]);
      return d ? d.getDate() : '';
    }
    if (upper === 'DATE') {
      const y = Number(args[0]) || 2026;
      const m = Number(args[1]) || 1;
      const day = Number(args[2]) || 1;
      return new Date(y, m - 1, day);
    }

    // 3. Văn bản
    if (upper === 'CONCATENATE' || upper === 'CONCAT') {
      return args.map((a) => (a !== undefined && a !== null ? String(a) : '')).join('');
    }
    if (upper === 'UPPER') {
      return String(args[0] ?? '').toUpperCase();
    }
    if (upper === 'LOWER') {
      return String(args[0] ?? '').toLowerCase();
    }
    if (upper === 'TRIM') {
      return String(args[0] ?? '').trim();
    }
    if (upper === 'LEN') {
      return String(args[0] ?? '').length;
    }
    if (upper === 'LEFT') {
      const str = String(args[0] ?? '');
      const count = Number(args[1]) || 0;
      return str.slice(0, count);
    }
    if (upper === 'RIGHT') {
      const str = String(args[0] ?? '');
      const count = Number(args[1]) || 0;
      return count > 0 ? str.slice(-count) : '';
    }
    if (upper === 'MID') {
      const str = String(args[0] ?? '');
      const start = Math.max(0, (Number(args[1]) || 1) - 1);
      const count = Number(args[2]) || 0;
      return str.slice(start, start + count);
    }
    if (upper === 'SUBSTITUTE') {
      const str = String(args[0] ?? '');
      const oldVal = String(args[1] ?? '');
      const newVal = String(args[2] ?? '');
      return str.replaceAll(oldVal, newVal);
    }

    // 4. Số học
    if (upper === 'ROUND') {
      const num = Number(args[0]) || 0;
      const decimals = Number(args[1]) || 0;
      return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
    }
    if (upper === 'INT') {
      return Math.floor(Number(args[0]) || 0);
    }
    if (upper === 'ABS') {
      return Math.abs(Number(args[0]) || 0);
    }
    if (upper === 'MAX') {
      const nums = args.map(Number).filter((n) => !isNaN(n));
      return nums.length ? Math.max(...nums) : 0;
    }
    if (upper === 'MIN') {
      const nums = args.map(Number).filter((n) => !isNaN(n));
      return nums.length ? Math.min(...nums) : 0;
    }
    if (upper === 'SUM') {
      return args.reduce((acc, a) => acc + (Number(a) || 0), 0);
    }
    if (upper === 'AVERAGE' || upper === 'AVG') {
      const nums = args.map(Number).filter((n) => !isNaN(n));
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
    }

    throw new Error(`Không tìm thấy hàm '${name}'`);
  }
}

/**
 * Hàm đánh giá công thức biểu thức tự do cho 1 bản ghi
 * @param {Object} record - Bản ghi dữ liệu
 * @param {string} expression - Biểu thức công thức (VD: IF(DATEDIF({ngay_di}, TODAY(), "D") > 30, "Quá hạn", "Đúng hạn"))
 * @param {Array} columns - Danh sách cột để mapping id và label
 */
export const evaluateCustomFormula = (record, expression, columns = [], fieldResolver = null) => {
  if (!expression || typeof expression !== 'string' || !expression.trim()) {
    return { status: 'empty', label: '', shortLabel: '', value: '' };
  }

  // Xây dựng context từ bản ghi
  const context = {};

  // Nạp toàn bộ các thuộc tính trực tiếp của record
  if (record && typeof record === 'object') {
    Object.keys(record).forEach((k) => {
      context[k] = record[k];
      context[k.toLowerCase()] = record[k];
    });

    // Nạp custom_data
    let cd = record.custom_data;
    if (typeof cd === 'string') {
      try { cd = JSON.parse(cd); } catch (e) { cd = {}; }
    }
    if (cd && typeof cd === 'object') {
      Object.keys(cd).forEach((k) => {
        context[k] = cd[k];
        context[k.toLowerCase()] = cd[k];
      });
    }


    // Nạp theo tên nhãn hiển thị (label) của cột từ dữ liệu sẵn có trên bản ghi
    if (Array.isArray(columns)) {
      columns.forEach((c) => {
        if (c && c.id) {
          const val = getRecordFieldValue(record, c.id);
          if (val !== undefined && val !== null) {
            context[c.id] = val;
            context[c.id.toLowerCase()] = val;
            if (c.label) {
              context[c.label] = val;
              context[c.label.toLowerCase()] = val;
            }
          }
        }
      });
    }
  }

  const evaluator = new FormulaEvaluator(context, fieldResolver);
  const result = evaluator.evaluate(expression);

  return {
    status: typeof result === 'boolean' ? (result ? 'true' : 'false') : 'success',
    label: String(result ?? ''),
    shortLabel: String(result ?? ''),
    value: result,
  };
};
