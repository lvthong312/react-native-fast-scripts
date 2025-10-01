import fs from 'fs';
import path from 'path';
const args = process.argv.slice(2);
// Default output directory = project root
let __dirname = process.cwd();

// Check for --dir argument
const dirIndex = args.findIndex((arg) => arg.startsWith("--dir"));
if (dirIndex !== -1) {
  const dirArg = args[dirIndex].split("=")[1] || args[dirIndex + 1];
  if (dirArg) {
    // Replace '@' with '.' to resolve project-relative path
    __dirname = path.resolve(process.cwd(), dirArg.replace(/^@/, "."));
    args.splice(dirIndex, 2);
  }
}

// Ensure output directory exists
if (!fs.existsSync(__dirname)) {
  fs.mkdirSync(__dirname, { recursive: true });
}

const errorsPath = path.join(__dirname, 'errors.json');
const outputPath = path.join(__dirname, '.', 'ErrorService.ts');

// Nếu chưa có errors.json thì tạo mặc định
if (!fs.existsSync(errorsPath)) {
  const defaultErrors = {
    UNKNOWN_ERROR: {
      en: 'Unknown error occurred',
      vi: 'Đã xảy ra lỗi không xác định',
    },
    NETWORK_ERROR: {
      en: 'Network connection failed',
      vi: 'Kết nối mạng thất bại',
    },
  };
  fs.writeFileSync(errorsPath, JSON.stringify(defaultErrors, null, 4), 'utf-8');
  console.log('⚠️ errors.json not found. Created default errors.json');
}

const errors = JSON.parse(fs.readFileSync(errorsPath, 'utf-8'));

// tạo enum ErrorCode
const enumEntries = Object.keys(errors)
  .map(key => `    ${key} = "${key}",`)
  .join('\n');


const content = `// ⚠️ AUTO-GENERATED FILE. DO NOT EDIT MANUALLY.
// Generated from errors.json
import errors from './errors.json'
export enum ErrorCode {
${enumEntries}
}

export type IErrorCode = keyof typeof errors


type Messages = { [lang: string]: string };

type ErrorItem = {
    code: IErrorCode;
    messages: Messages;
};

const errorArray: ErrorItem[] = Object.entries(errors)?.map?.((item) => {
    return {
        code: item?.[0] as IErrorCode,
        messages: item?.[1]
    }
})

export class ErrorService {
    private static errorList: Map<IErrorCode, Messages> = new Map([]);
    private static currentLang: string = "vi";

    static init(defaultLang: string = "vi") {
        this.errorList = new Map(errorArray.map(item => [item.code, item.messages]));
        this.currentLang = defaultLang;
    }

    static setLang(lang: string) {
        this.currentLang = lang;
    }

    static getErrorMessage(code: IErrorCode): string | null {
        const messages = this.errorList.get(code);
        if (!messages) return null;
        return messages[this.currentLang] ?? messages["en"] ?? "Unknown error";
    }

    static getAllErrors(): { code: IErrorCode; message: string }[] {
        return Array.from(this.errorList.entries()).map(([code, messages]) => ({
            code,
            message: messages[this.currentLang] ?? messages["en"] ?? "Unknown error",
        }));
    }

    static getAllCodes(): IErrorCode[] {
        return Array.from(this.errorList.keys());
    }

    static hasCode(code: IErrorCode): boolean {
        return this.errorList.has(code);
    }
}
`;

fs.writeFileSync(outputPath, content, 'utf-8');
console.log('✅ Generated ErrorService.ts successfully!');
