-- F.S.A. Founder Console least-privilege execution grants.
revoke execute on all functions in schema fsa_private from public, anon, authenticated;
grant execute on function fsa_private.is_operator_active(uuid) to authenticated;
grant execute on function fsa_private.is_founder(uuid) to authenticated;
grant execute on function fsa_private.current_agent_id(uuid) to authenticated;

revoke all on function public.fsa_rpc_create_player(text,text,uuid,bigint,text[],text) from public,anon;
revoke all on function public.fsa_rpc_adjust_credits(uuid,bigint,text) from public,anon;
revoke all on function public.fsa_rpc_reverse_credit(uuid,text) from public,anon;
revoke all on function public.fsa_rpc_update_player(uuid,text,text,uuid,text) from public,anon;
revoke all on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) from public,anon;
revoke all on function public.fsa_rpc_set_agent_games(uuid,text[]) from public,anon;
revoke all on function public.fsa_rpc_set_player_games(uuid,text[]) from public,anon;

grant execute on function public.fsa_rpc_create_player(text,text,uuid,bigint,text[],text) to authenticated;
grant execute on function public.fsa_rpc_adjust_credits(uuid,bigint,text) to authenticated;
grant execute on function public.fsa_rpc_reverse_credit(uuid,text) to authenticated;
grant execute on function public.fsa_rpc_update_player(uuid,text,text,uuid,text) to authenticated;
grant execute on function public.fsa_rpc_update_agent(uuid,text,text,bigint,boolean,boolean) to authenticated;
grant execute on function public.fsa_rpc_set_agent_games(uuid,text[]) to authenticated;
grant execute on function public.fsa_rpc_set_player_games(uuid,text[]) to authenticated;
