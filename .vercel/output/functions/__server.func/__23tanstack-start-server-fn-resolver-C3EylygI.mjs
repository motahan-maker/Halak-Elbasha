//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-C3EylygI.js
var manifest = {
	"419d58d00210e2083a03f3ad0e4f314ee990baea6954847361c11c1a7c216311": {
		functionName: "resetBarberPassword_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-DtMp32r9.mjs")
	},
	"57b58cf6a8c245d716695288348b07ab31035930bfad688bc9844ed38b06e02e": {
		functionName: "ensureDefaultAdmin_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-DtMp32r9.mjs")
	},
	"a3ccb93e8665d6db1768fbd2a5d92b31924e354ab917d7fd403fa93b39b20c13": {
		functionName: "claimAdminIfFirst_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-DtMp32r9.mjs")
	},
	"b1537e61a656cd0851fe74f4a17c41b7651346b0e8aee195a29575510c7ece6a": {
		functionName: "createBarberAccount_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-DtMp32r9.mjs")
	},
	"c22218c9cb6cb29e5c4f7d034cb4f541192d6b10f58ffbaac59a97a303a1b838": {
		functionName: "deleteBarberAccount_createServerFn_handler",
		importer: () => import("./_ssr/admin.functions-DtMp32r9.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
