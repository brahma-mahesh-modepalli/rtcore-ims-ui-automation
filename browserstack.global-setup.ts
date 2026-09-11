import * as dotenv from 'dotenv';

dotenv.config();

type BrowserStackLocalInstance = {
  start(options: Record<string, string>, callback: (error?: Error) => void): void;
  stop(callback: (error?: Error) => void): void;
};

export default async function globalSetup(): Promise<() => Promise<void>> {
  const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
  if (!accessKey) {
    throw new Error('BrowserStack access key missing. Set BROWSERSTACK_ACCESS_KEY before starting BrowserStack Local.');
  }

  const browserstackLocal = require('browserstack-local');
  const localIdentifier = process.env.BROWSERSTACK_LOCAL_IDENTIFIER || 'rtcore-ims-ui-automation-local';
  const bsLocal: BrowserStackLocalInstance = new browserstackLocal.Local();

  await new Promise<void>((resolve, reject) => {
    bsLocal.start(
      {
        key: accessKey,
        localIdentifier,
        forceLocal: 'true',
      },
      (error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        console.log(`BrowserStack Local tunnel started: ${localIdentifier}`);
        resolve();
      },
    );
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      bsLocal.stop((error?: Error) => {
        if (error) {
          reject(error);
          return;
        }
        console.log('BrowserStack Local tunnel stopped');
        resolve();
      });
    });
  };
}
