import * as https from 'https';
import * as URL from 'url';
import { promises } from 'fs';

//TODO: THIS DISABLES TLS CERTIFICATE VALIDATION PROCESS-WIDE
//THIS IS A GAPING SECURITY HOLE
//DO NOT USE IN A CONTEXT WHERE MITM IS A RISK
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function get(url: string): Promise<string> {
    return new Promise(function (resolve, reject) {
        const u = URL.parse(url);
        https.get(u, res => {
            if (res.statusCode !== 200) {
                return reject('Non-200 response from Matrox device. Code: ' + res.statusCode);
            }
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => resolve(data));
            res.on('error', err => reject(err));
        }).end();
    });
}

export class MatroxLCS {
    host: string = '';
    user: string = '';
    pass: string = '';

    constructor(hostname: string, username: string, password: string) {
        this.host = hostname;
        this.user = username;
        this.pass = password;
    }

    private async sendCommand(command: string) {
        return await get(`https://${this.user}:${this.pass}@${this.host}/Monarch/syncconnect/sdk.aspx?command=${command}`);
    }

    public async getStatus() {
        const status = await this.sendCommand('GetStatus');
        const segments = status.split(/[:,]+/); //split the string on both commas and colons
        if (segments.length !== 10 || segments[0] !== 'ENC1' || segments[3] !== 'ENC2' || segments[6] !== 'FILETRANSFER' || segments[8] !== 'NAME') {
            throw new Error('GetStatus response received from Matrox device was not in the expected format. Expected ' +
                '"ENC1:<mode>,<state>,ENC2:<mode>,<state>,FILETRANSFER:<state>,NAME:<devicename>", received ' + segments + 
                '. It is likely that the device has been updated to a new version or is not functioning properly');
        }

        const inputStatus = await this.sendCommand('GetInputStatus');
        const inputs : {[index: string]: {mode: string, width: number, height: number, interlacing: 'i'|'p', fps: number}} = {};
        inputStatus.split(';')
            .forEach(input => {
                const regex = /(HDMI|SDI) (A|B): ((\d{3,4})x(\d{3,4})(i|p)?, (\d{1,3}|\d{1,3}.\d{1,3})? fps|No video input)/;
                if (!regex.test(input)) {
                    throw new Error('GetInputStatus response received from Matrox device was not in the expected format.' + 
                        'Expected something like "HDMI A: 1920x1080p, 60 fps" or "No video input", but got ' + input +
                        '. It is likely that the device has been updated to a new version or is not functioning properly');
                }
                const segments = input.match(regex) || [];
                inputs[segments[2]] = {
                    mode: segments[1],
                    width: Number(segments[3]),
                    height: Number(segments[4]),
                    interlacing: segments[5] === 'i' ? 'i' : 'p',
                    fps: Number(segments[6]),
                };
            });
        return {
            name: segments[9],
            inputs,
            encoder1: {
                mode: segments[1],
                state: segments[2],
            },
            encoder2: {
                mode: segments[4],
                state: segments[5],
            },
            filetransfer: {
                state: segments[7],
            },
        };
    }

    public async getRecordFileName() {
        return await this.sendCommand('GetRecordFileName');
    }

    public async getTransferLocation() {
        return await this.sendCommand('list');
    }
}

