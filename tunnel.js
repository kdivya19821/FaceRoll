import localtunnel from 'localtunnel';

const SUBDOMAIN = 'faceroll-final-2026'; // unique to avoid instant drop from old session

async function startTunnel() {
  console.log("Starting reliable tunnel...");
  try {
    const tunnel = await localtunnel({ port: 5173, subdomain: SUBDOMAIN });
    console.log(`\n\n=== YOUR URL IS: ===`);
    console.log(`${tunnel.url}`);
    console.log(`====================\n\n`);

    tunnel.on('close', () => {
      console.log('Localtunnel dropped the connection. Auto-reconnecting in 1 second...');
      setTimeout(startTunnel, 1000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel encountered an error:', err);
      tunnel.close(); 
    });
  } catch (err) {
    console.log('Failed to connect to localtunnel servers. Retrying in 2s...', err.message);
    setTimeout(startTunnel, 2000);
  }
}

startTunnel();
