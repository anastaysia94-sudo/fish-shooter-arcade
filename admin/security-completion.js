import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const SUPABASE_URL='https://nqcshihyfhthywpseilx.supabase.co'
const SUPABASE_KEY='sb_publishable_lD--sdVpwV9djLF28XW1Jg_95DPa58G'
const ADMIN_PATH='/fish-shooter-arcade/admin/'
const IDLE_MS=30*60*1000
const supabase=createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}})
const $=s=>document.querySelector(s)

function setMessage(id,text,danger=false){const el=$(id);if(!el)return;el.textContent=text;el.classList.toggle('danger',danger)}
function showRecovery(){ $('#authGate')?.classList.add('hidden'); $('#consoleShell')?.classList.add('hidden'); $('#recoveryGate')?.classList.remove('hidden') }
function showAuth(){ $('#recoveryGate')?.classList.add('hidden'); $('#consoleShell')?.classList.add('hidden'); $('#authGate')?.classList.remove('hidden') }

async function sha1Hex(value){
  const data=new TextEncoder().encode(value)
  const digest=await crypto.subtle.digest('SHA-1',data)
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase()
}

async function checkCompromisedPassword(password){
  if(password.length<12)throw new Error('Use at least 12 characters.')
  const hash=await sha1Hex(password),prefix=hash.slice(0,5),suffix=hash.slice(5)
  const response=await fetch(`https://api.pwnedpasswords.com/range/${prefix}`,{headers:{'Add-Padding':'true'}})
  if(!response.ok)throw new Error('Password breach check is temporarily unavailable. Try again before changing the password.')
  const body=await response.text()
  let count=0
  for(const line of body.split(/\r?\n/)){
    const [candidate,n]=line.trim().split(':')
    if(candidate===suffix){count=Number(n||0);break}
  }
  if(count>0)throw new Error('That password appears in known breach data. Choose a different password.')
  return true
}

async function importRecoveryLink(raw){
  const value=String(raw||'').trim()
  if(!value)throw new Error('Paste the full Supabase password-reset link from the email.')
  let url
  try{url=new URL(value)}catch{throw new Error('That is not a valid recovery URL.')}
  if(url.origin!==SUPABASE_URL)throw new Error('That recovery link is not for this F.S.A. Supabase project.')
  if(url.searchParams.get('type')!=='recovery')throw new Error('That link is not a password-recovery link.')
  const tokenHash=url.searchParams.get('token_hash')||url.searchParams.get('token')
  if(!tokenHash)throw new Error('The recovery link does not contain a recovery token.')
  const {data,error}=await supabase.auth.verifyOtp({token_hash:tokenHash,type:'recovery'})
  if(error)throw error
  if(!data?.session)throw new Error('The recovery token did not create a session.')
  history.replaceState({},document.title,location.pathname)
  showRecovery()
  setMessage('#recoveryMessage','Recovery link verified. Choose a new password.')
}

const useLink=$('#useRecoveryLink')
if(useLink)useLink.addEventListener('click',async()=>{
  useLink.disabled=true
  try{await importRecoveryLink($('#recoveryLinkInput')?.value)}catch(error){setMessage('#authMessage',error?.message||String(error),true)}finally{useLink.disabled=false}
})

const forgot=$('#forgotPassword')
if(forgot)forgot.addEventListener('click',()=>setTimeout(()=>{
  const msg=$('#authMessage')
  if(msg&&!msg.textContent.toLowerCase().includes('error'))msg.textContent='Password reset email requested. If its button opens localhost or another wrong page, copy the full reset link and paste it below.'
},250))

const recoveryForm=$('#recoveryForm')
if(recoveryForm)recoveryForm.addEventListener('submit',async event=>{
  event.preventDefault()
  event.stopImmediatePropagation()
  const password=$('#newPassword')?.value||'',confirm=$('#confirmPassword')?.value||''
  if(password!==confirm)return setMessage('#recoveryMessage','Passwords do not match.',true)
  const submit=recoveryForm.querySelector('button[type="submit"]')
  if(submit)submit.disabled=true
  try{
    setMessage('#recoveryMessage','Checking password against known breach data…')
    await checkCompromisedPassword(password)
    const {error}=await supabase.auth.updateUser({password})
    if(error)throw error
    await supabase.auth.signOut()
    setMessage('#authMessage','Password updated. All browser sessions were signed out; sign in again and complete MFA.')
    showAuth()
  }catch(error){setMessage('#recoveryMessage',error?.message||String(error),true)}finally{if(submit)submit.disabled=false}
},true)

const securityBox=document.querySelector('#securityDialog .security-box')
if(securityBox&&!$('#fsaPasswordRotate')){
  const block=document.createElement('section')
  block.id='fsaPasswordRotate'
  block.className='stack password-rotate'
  block.innerHTML='<h3>Rotate password</h3><p class="muted">F.S.A. checks new passwords against the free Have I Been Pwned k-anonymity service before Supabase accepts them.</p><input id="rotatePassword" type="password" autocomplete="new-password" minlength="12" placeholder="New password"><input id="rotatePasswordConfirm" type="password" autocomplete="new-password" minlength="12" placeholder="Confirm new password"><button id="rotatePasswordButton" type="button">Change password</button><div id="rotatePasswordMessage" class="message"></div>'
  securityBox.insertBefore(block,securityBox.querySelector('menu'))
  $('#rotatePasswordButton')?.addEventListener('click',async()=>{
    const button=$('#rotatePasswordButton'),password=$('#rotatePassword')?.value||'',confirm=$('#rotatePasswordConfirm')?.value||''
    if(password!==confirm)return setMessage('#rotatePasswordMessage','Passwords do not match.',true)
    button.disabled=true
    try{
      setMessage('#rotatePasswordMessage','Checking breach corpus…')
      await checkCompromisedPassword(password)
      const {error}=await supabase.auth.updateUser({password})
      if(error)throw error
      await supabase.auth.signOut()
      location.replace(ADMIN_PATH)
    }catch(error){setMessage('#rotatePasswordMessage',error?.message||String(error),true);button.disabled=false}
  })
}

async function consumeRecoveryQuery(){
  const params=new URLSearchParams(location.search)
  const type=params.get('type'),tokenHash=params.get('token_hash')
  if(type==='recovery'&&tokenHash){
    try{
      const {data,error}=await supabase.auth.verifyOtp({type:'recovery',token_hash:tokenHash})
      if(error)throw error
      if(data?.session){history.replaceState({},document.title,location.pathname);showRecovery()}
    }catch(error){setMessage('#authMessage',error?.message||String(error),true)}
  }
}
consumeRecoveryQuery()

let idleTimer
function resetIdle(){clearTimeout(idleTimer);idleTimer=setTimeout(async()=>{
  const {data}=await supabase.auth.getSession()
  if(!data.session)return
  await supabase.auth.signOut()
  location.replace(ADMIN_PATH+'?expired=1')
},IDLE_MS)}
for(const eventName of ['pointerdown','keydown','touchstart'])addEventListener(eventName,resetIdle,{passive:true})
resetIdle()

if(new URLSearchParams(location.search).get('expired')==='1')setMessage('#authMessage','Signed out after 30 minutes of inactivity.')
