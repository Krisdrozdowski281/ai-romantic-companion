const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const container = 'supabase_db_ai-romantic-companion';
const database = 'sprint2_verify_' + process.pid + '_' + Date.now();
function docker(args, input) {
  const result = spawnSync('docker', args, {
    input,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0)
    throw new Error(result.stderr || 'Docker database command failed.');
  return result.stdout;
}
function sql(input) {
  return docker(
    [
      'exec',
      '-i',
      container,
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      database,
      '-t',
      '-A',
    ],
    input,
  );
}
let created = false;
try {
  // Copy only the platform auth schema, never users or existing application data.
  const schema = docker([
    'exec',
    container,
    'pg_dump',
    '-U',
    'postgres',
    '-d',
    'postgres',
    '--schema-only',
    '--no-owner',
    '--no-privileges',
    '--schema=auth',
  ]);
  docker(['exec', container, 'createdb', '-U', 'postgres', database]);
  created = true;
  sql(schema);
  sql(
    'create extension if not exists pgtap; grant usage on schema public, auth to authenticated, anon;',
  );
  for (const name of fs
    .readdirSync('supabase/migrations')
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    sql(fs.readFileSync('supabase/migrations/' + name, 'utf8'));
    console.log('Applied migration: ' + name);
  }
  for (const name of fs
    .readdirSync('supabase/tests')
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const tap = sql(fs.readFileSync('supabase/tests/' + name, 'utf8'));
    console.log(tap);
    const assertions = tap
      .split(/\r?\n/)
      .filter((line) => /^(?:not )?ok \d+/.test(line));
    const plan = tap.match(/^1\.\.(\d+)$/m);
    if (/^not ok /m.test(tap) || !plan || assertions.length !== Number(plan[1]))
      throw new Error('RLS assertions failed or incomplete.');
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (created)
    docker(['exec', container, 'dropdb', '-U', 'postgres', database]);
}
