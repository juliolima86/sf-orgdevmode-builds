/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unused-vars */
import * as ChildProcess from 'node:child_process';
import { expect, test } from '@oclif/test';
import * as sinon from 'sinon';

// Import the BuildsDeploy command class
import BuildsDeploy, * as deploy from '../../../src/commands/builds/deploy';

describe('BuildsDeploy', () => {
  const buildManifest1 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
        testLevel: 'RunSpecifiedTests',
        preDestructiveChanges: 'path/to/preDestructiveChanges.xml',
        postDestructiveChanges: 'path/to/postDestructiveChanges.xml',
        ignoreWarnings: true,
        timeout: 60,
        enableTracking: true,
      },
      {
        type: 'datapack',
        manifestFile: 'path/to/sfi-package.yaml',
      },
      {
        type: 'anonymousApex',
        apexScript: 'path/to/anonymousApex',
      },
      {
        type: 'command',
        command: 'sf --version',
      },
    ],
  };

  const buildManifest2 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
        testLevel: 'NoTestRun',
      },
    ],
  };

  const buildManifest3 = {
    builds: [
      {
        type: 'metadata',
        manifestFile: 'path/to/package.xml',
      },
    ],
  };

  const spawnSyncReturns: ChildProcess.SpawnSyncReturns<string> = {
    pid: 1234,
    output: ['Stub executed successfully', null],
    stdout: 'Stub executed successfully',
    status: 0,
    stderr: '',
    signal: null,
  };

  const execSpawnSync = sinon.stub(deploy, 'execSpawnSync').returns(spawnSyncReturns);
  const execReadFileSync = sinon.stub(deploy, 'execReadFileSync');
  execReadFileSync.onCall(0).returns(JSON.stringify(buildManifest1));
  execReadFileSync
    .onCall(1)
    .returns('<Package><types><members>BaseClassTest</members><name>ApexClass</name></types></Package>');
  execReadFileSync.onCall(2).returns('@IsTest() public class BaseClassTest');
  execReadFileSync.onCall(3).returns(JSON.stringify(buildManifest2));
  execReadFileSync.onCall(4).returns(JSON.stringify(buildManifest3));

  test
    .stdout()
    .do(() =>
      BuildsDeploy.run([
        '--buildfile',
        'path/to/buildfile.json',
        '--client-id',
        'client-id-123',
        '--instance-url',
        'https://login.salesforce.com/',
        '--username',
        'user@login.sample',
        '--jwt-key-file',
        'path/to/server.key',
      ])
    )
    .it('should execute the build with authentication', (ctx) => {
      expect(ctx.stdout).to.contain('sf org login jwt');
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('vlocity -sfdx.username');
      expect(ctx.stdout).to.contain('sf apex run');
      expect(ctx.stdout).to.contain('sf --version');
      expect(execSpawnSync.calledOnce).to.be.false;
      expect(execSpawnSync.firstCall.args[0]).to.equal('sf'); // auth
      expect(execSpawnSync.secondCall.args[0]).to.equal('sf'); // deploy
      expect(execSpawnSync.thirdCall.args[0]).to.equal('vlocity'); // deploy
    });

  test
    .stdout()
    .do(() => BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']))
    .it('should execute the build without authenticating again with test level defined', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('NoTestRun');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');
    });

  test
    .stdout()
    .do(() => BuildsDeploy.run(['--buildfile', 'path/to/buildfile.json', '--target-org', 'alias']))
    .it('should execute the build without authenticating again and without test level defined on buildfile', (ctx) => {
      expect(ctx.stdout).to.contain('sf project deploy start');
      expect(ctx.stdout).to.contain('RunLocalTest');
      expect(ctx.stdout).to.not.contain('sf org login jwt');
      expect(ctx.stdout).to.not.contain('vlocity -sfdx.username');
    });
});
