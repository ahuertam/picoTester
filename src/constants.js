export const STORAGE_KEYS = {
  config: 'picotester:config',
  retryQueue: 'picotester:retryQueue',
  questions: 'picotester:questions',
  excluded: 'picotester:excluded',
  lastUploadAt: 'picotester:lastUploadAt',
}

export const DEFAULT_CONFIG = {
  timePerExam: 0, // minutos; 0 = sin límite
  questionCount: 20,
  randomOrder: false,
  showResultImmediately: true,
  navigationMode: 'free', // 'free' | 'sequential'
}
