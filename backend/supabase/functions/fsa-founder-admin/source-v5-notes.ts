// Source-control contract for deployed fsa-founder-admin v5.
// Auth invitations stay server-side inside the Edge Function; browsers never receive privileged credentials.
export const deployedFunction = {
  version: 5,
  sha256: 'f436af0d7046ebf3a88c3d6663fb1b121b7988a35b24d7b3446fd0a9d39f34b5',
  verifyJwt: true,
  distributorProvisioning: 'fsa_rpc_provision_distributor_operator',
  agentProvisioning: 'fsa_rpc_provision_agent_operator',
  playerProvisioning: 'fsa_service_create_network_player',
  allowedBrowserOrigin: 'https://anastaysia94-sudo.github.io'
} as const
