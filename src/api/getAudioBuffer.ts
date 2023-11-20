import env from '../config/env';
import { Synthesize, SynthesizePayload, TaskStatus } from '../types/capcut';
import logger from '../utils/log';
import { WebSocket } from 'ws';
import speakerParser from '../utils/speakerParser';
export default function getAudioBuffer(token: string, appkey: string, text: string, type: number, pitch: number = 10, speed: number = 10, volume: number = 10): Promise<Buffer | null> {
    return new Promise((resolve, reject) => {
        // WS Connect
        const ws = new WebSocket(env.ByteintlApi+"/ws");
        ws.on('open', () => {
            logger.debug("connect ws");
            ws.send(JSON.stringify({
                token: token,
                appkey: appkey,
                namespace: 'TTS',
                event: 'StartTask',
                payload: JSON.stringify({
                    text: text,
                    speaker: speakerParser(type),
                    pitch: pitch,
                    speed: speed,
                    volume: volume,
                    rate: 24000,
                    appid: '348188',
                } as SynthesizePayload)
            } as Synthesize));
        });
        
        let audioBuffer: Buffer = Buffer.from([]);
        ws.on('message', (data) => {
            try {
                const dataJson = JSON.parse(data.toString()) as TaskStatus;
                
                if (dataJson.event === 'TaskStarted') {
                    logger.debug("TaskStarted: "+dataJson.task_id);
                } else if (dataJson.event === 'TaskFinished') {
                    logger.debug("TaskFinished: "+dataJson.task_id);
                    ws.close();
                    resolve(audioBuffer);
                }
            } catch (error) {
                audioBuffer = Buffer.concat([audioBuffer, data as Buffer]);
            }
        });
    
        ws.on('error', (error) => {
            ws.close();
            logger.error('WebSocket error:', error);
            resolve(null);
        });
    });
}