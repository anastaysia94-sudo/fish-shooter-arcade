export const hierarchyProvisioning = Object.freeze({
  distributorRpc: 'fsa_rpc_provision_distributor_operator',
  agentRpc: 'fsa_rpc_provision_agent_operator',
  requiresAal2: true,
  sourceOfTruth: 'postgres'
})

export function validFsaUsername(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._-]{1,59}$/.test(value)
}
