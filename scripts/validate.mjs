/* Simple validation runner to match local and CI */
import { spawn } from 'node:child_process';

const run = (cmd, args) =>
  new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} failed`))));
  });

try {
  await run('pnpm', ['lint']);
  await run('pnpm', ['typecheck']);
  await run('pnpm', ['test']);
  console.log('\n✅ All checks passed!');
} catch (err) {
  console.error('\n❌ Validation failed:', err.message);
  process.exit(1);
}
