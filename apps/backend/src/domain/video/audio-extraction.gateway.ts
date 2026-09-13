export interface AudioExtractionGateway { extract(videoPath: string, outputPath: string): Promise<{ audioPath: string }>; }
