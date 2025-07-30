import { CodeBlockWriter } from 'ts-morph';

interface GenerateOptions {
    inputGlob: string;
    outputFile: string;
    baseDir: string;
    varName: string;
    specificKeyword: string;
    importType?: 'default' | 'type';
    write: (writer: CodeBlockWriter, classes: {
        className: string;
        path: string;
    }[]) => void;
}
declare function generateConfig(options: GenerateOptions): Promise<void>;

export { generateConfig };
