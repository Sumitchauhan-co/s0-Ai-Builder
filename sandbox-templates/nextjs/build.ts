import { Template, defaultBuildLogger } from 'e2b';
import { template as nextJSTemplate } from './template';
import dotenv from 'dotenv';
dotenv.config();

Template.build(nextJSTemplate, 'c0-build', {
	cpuCount: 4,
	memoryMB: 4096,
	onBuildLogs: defaultBuildLogger(),
	apiKey: 'e2b_58df1c3b833a3e384991f5e5e35eafe06f811c44',
});
