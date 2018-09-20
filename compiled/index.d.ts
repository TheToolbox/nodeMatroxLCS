export declare class MatroxLCS {
    host: string;
    user: string;
    pass: string;
    constructor(hostname: string, username: string, password: string);
    private sendCommand;
    getStatus(): Promise<{
        name: string;
        inputs: {
            [index: string]: {
                mode: string;
                width: number;
                height: number;
                interlacing: "i" | "p";
                fps: number;
            };
        };
        encoder1: {
            mode: string;
            state: string;
        };
        encoder2: {
            mode: string;
            state: string;
        };
        filetransfer: {
            state: string;
        };
    }>;
    getRecordFileName(): Promise<string>;
    getTransferLocation(): Promise<string>;
}
