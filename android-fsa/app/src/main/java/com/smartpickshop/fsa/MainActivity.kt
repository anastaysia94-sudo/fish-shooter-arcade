package com.smartpickshop.fsa

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.util.UUID

private val Deep=Color(0xFF02080E); private val Panel=Color(0xED081B29); private val Line=Color(0xFF285B72)
private val Cyan=Color(0xFF43E6FF); private val Teal=Color(0xFF4DE8B9); private val Gold=Color(0xFFFFC95F)
private val Orange=Color(0xFFFF812D); private val Purple=Color(0xFFA45CFF); private val Muted=Color(0xFF96B5C2)

class MainActivity:ComponentActivity(){override fun onCreate(b:Bundle?){super.onCreate(b);setContent{FsaApp()}}}

@Composable fun FsaApp(){
 var server by remember{mutableStateOf("")}; var username by remember{mutableStateOf("")}; var password by remember{mutableStateOf("")}
 var token by remember{mutableStateOf("")}; var userId by remember{mutableStateOf("")}; var sessionId by remember{mutableStateOf<String?>(null)}; var sessionKey by remember{mutableStateOf<String?>(null)}
 var status by remember{mutableStateOf("Complex shell ready")}; var config by remember{mutableStateOf("Not synced")}; var balance by remember{mutableStateOf("12,450")}; var shots by remember{mutableIntStateOf(0)}
 var mode by remember{mutableStateOf("Reef Run")}; var seconds by remember{mutableIntStateOf(8077)}
 val api=remember{Api()}; val scope=rememberCoroutineScope()
 LaunchedEffect(Unit){while(true){delay(1000);seconds=if(seconds<=0)8077 else seconds-1}}
 MaterialTheme(colorScheme=darkColorScheme(primary=Orange,secondary=Cyan,tertiary=Purple,background=Deep,surface=Panel)){
  Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color(0xFF04344A),Deep,Color.Black)))){
   LazyColumn(Modifier.fillMaxSize().padding(14.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
    item{TopBar(balance,token.isNotBlank(),status)}
    item{Hero(seconds,mode){mode=it}}
    item{QuickDeploy(mode){mode=it}}
    item{MissionTelemetry(shots,sessionId!=null)}
    item{LoginPanel(server,username,password,token,{server=it},{username=it},{password=it}){
     scope.launch{status="Signing in…";runCatching{withContext(Dispatchers.IO){api.post(server,"/login",JSONObject().put("username",username).put("password",password),null)}}.onSuccess{r->val u=r.getJSONObject("user");if(u.getString("role")!="player")status="Player account required" else{token=r.getString("token");userId=u.getString("id");status="Signed in · secure player channel"}}.onFailure{status=it.message?:"Sign-in error"}}
    }}
    item{Panel("SHARED CONTROL PLANE","Live Operations"){
     Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Metric("CONFIG",config,Cyan,Modifier.weight(1f));Metric("BALANCE",balance,Gold,Modifier.weight(1f))}
     Button(enabled=token.isNotBlank(),onClick={scope.launch{status="Syncing…";runCatching{withContext(Dispatchers.IO){api.get(server,"/config",null) to api.get(server,"/me",token)}}.onSuccess{(c,me)->config="v${c.getInt("version")} · difficulty ${c.getDouble("difficulty")}× · HP ${c.getDouble("hp")}×";balance=fmt(me.getDouble("balance"));status="Control plane synchronized"}.onFailure{status=it.message?:"Sync error"}}},modifier=Modifier.fillMaxWidth()){Text("SYNC OWNED CONTROL PLANE")}
    }}
    item{Loadout()}
    item{Session(mode,sessionId,shots,token,
     onStart={scope.launch{status="Starting $mode…";runCatching{withContext(Dispatchers.IO){val r=api.post(server,"/session/start",JSONObject().put("mode",mode),token);val sid=r.getString("sessionId");val sk=r.getString("sessionKey");api.post(server,"/telemetry",event(sid,sk,userId,"session_started",JSONObject().put("client","android-v10").put("mode",mode)),null);sid to sk}}.onSuccess{(sid,sk)->sessionId=sid;sessionKey=sk;shots=0;status="$mode active · exact telemetry"}.onFailure{status=it.message?:"Session error"}}},
     onFire={val sid=sessionId;val sk=sessionKey;if(sid!=null&&sk!=null)scope.launch{runCatching{withContext(Dispatchers.IO){val cr=api.post(server,"/game/credit",JSONObject().put("sessionId",sid).put("sessionKey",sk).put("direction","remove").put("amount",1).put("reason","Android cannon shot"),null);api.post(server,"/telemetry",event(sid,sk,userId,"shot_observed",JSONObject().put("cannonLevel",6).put("cost",1).put("mode",mode)),null);cr}}.onSuccess{cr->shots++;balance=fmt(cr.getDouble("balance"));status="Exact shot emitted · cannon Mk VI"}.onFailure{status=it.message?:"Shot error"}}},
     onEnd={val sid=sessionId;val sk=sessionKey;if(sid!=null&&sk!=null)scope.launch{status="Ending…";runCatching{withContext(Dispatchers.IO){api.post(server,"/telemetry",event(sid,sk,userId,"session_ended",JSONObject().put("shots",shots).put("mode",mode)),null);api.post(server,"/session/end",JSONObject().put("sessionId",sid).put("sessionKey",sk).put("shots",shots).put("kills",0).put("score",0),null)}}.onSuccess{sessionId=null;sessionKey=null;status="Session ended · telemetry sealed"}.onFailure{status=it.message?:"End error"}}}
    )}
    item{Panel("EGM4000 BRIDGE","Controlled Experimental Target"){Text("PLAY → F.S.A. EMITS → EGM4000 MEASURES",color=Cyan,fontWeight=FontWeight.Black);Text("egm4000.gameplay-event.v1 · exact_telemetry · source FSA-SV10-ANDROID · confidence 1.0",color=Muted,fontSize=10.sp)}}
    item{Text("F.S.A. Android v10 · virtual/non-cash entertainment. No cash redemption. No third-party credential interception, balance manipulation, protection bypass, or outcome guarantees.",color=Color(0xFF70909C),fontSize=9.sp,lineHeight=13.sp,modifier=Modifier.padding(6.dp))}
   }
  }
 }
}

@Composable private fun TopBar(balance:String,signed:Boolean,status:String){Surface(color=Color(0xEE05131E),shape=RoundedCornerShape(16.dp),border=BorderStroke(1.dp,Line)){Column(Modifier.padding(12.dp),verticalArrangement=Arrangement.spacedBy(8.dp)){Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(10.dp)){Box(Modifier.size(44.dp).background(Brush.radialGradient(listOf(Gold,Color(0xFF61340B))),CircleShape),contentAlignment=Alignment.Center){Text("♛",color=Deep,fontSize=24.sp,fontWeight=FontWeight.Black)};Column(Modifier.weight(1f)){Text("FISH SHOOTER ARCADE",fontWeight=FontWeight.Black,letterSpacing=1.sp);Text("ANDROID COMPLEX SHELL v10",color=Cyan,fontSize=10.sp,fontWeight=FontWeight.Bold)};Pill(if(signed)"ONLINE" else "LOCAL",if(signed)Teal else Gold)};Row(horizontalArrangement=Arrangement.spacedBy(6.dp)){Chip("●",balance,Gold);Chip("ENGINE","v4",Cyan);Chip("SIGNAL","EXACT",Teal)};Text(status,color=Muted,fontSize=10.sp)}}}

@Composable private fun Hero(seconds:Int,mode:String,onMode:(String)->Unit){Card(colors=CardDefaults.cardColors(containerColor=Color.Transparent),shape=RoundedCornerShape(20.dp),border=BorderStroke(1.dp,Color(0xFFA87532))){Column(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Color(0xFF09111E),Color(0xFF074A61),Color(0xFF32100F)))).padding(20.dp),verticalArrangement=Arrangement.spacedBy(9.dp)){Text("LIVE REEF EVENT · OWNED F.S.A. SIMULATION",color=Gold,fontSize=9.sp,fontWeight=FontWeight.Black);Row(verticalAlignment=Alignment.CenterVertically){Column(Modifier.weight(1f)){Text("DRAGON KING",fontSize=37.sp,lineHeight=35.sp,fontWeight=FontWeight.Black);Text("ABYSS ASSAULT",color=Cyan,fontSize=17.sp,fontWeight=FontWeight.Black,letterSpacing=1.sp)};Text("🐉",fontSize=60.sp)};Text("Premium Table Engine v4 · boss phases · radar · powers · Fever · simulated rivals · exact owned-game telemetry.",color=Color(0xFFD1E6ED),fontSize=12.sp,lineHeight=17.sp);Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button(onClick={onMode("Dragon Depths")},colors=ButtonDefaults.buttonColors(containerColor=Orange)){Text("HUNT NOW")};OutlinedButton(onClick={onMode("Reef Run")},border=BorderStroke(1.dp,Cyan)){Text("REEF RUN")}};Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){Pill("LIVE",Teal);Text(timer(seconds),fontSize=23.sp,fontWeight=FontWeight.Black);Text("Selected: $mode",color=Muted,fontSize=9.sp)}}}}

@Composable private fun QuickDeploy(mode:String,onMode:(String)->Unit){Panel("QUICK DEPLOY","Choose Your Water"){Column(verticalArrangement=Arrangement.spacedBy(7.dp)){Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){Mode("🦈","Reef Run","Balanced",mode=="Reef Run",Modifier.weight(1f)){onMode("Reef Run")};Mode("🐉","Dragon Depths","Boss-heavy",mode=="Dragon Depths",Modifier.weight(1f)){onMode("Dragon Depths")}};Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){Mode("🐙","Kraken's Lair","Survival",mode=="Kraken's Lair",Modifier.weight(1f)){onMode("Kraken's Lair")};Mode("👹","Boss Rush","Endgame",mode=="Boss Rush",Modifier.weight(1f)){onMode("Boss Rush")}}}}}

@Composable private fun MissionTelemetry(shots:Int,active:Boolean){Row(horizontalArrangement=Arrangement.spacedBy(9.dp)){Panel("CAPTAIN'S ORDERS","Daily Missions",Modifier.weight(1f)){Mission("Fire 50 shots",shots,50);Mission("Feature encounter",if(active)1 else 0,1);Mission("Combo chain",(shots/3).coerceAtMost(25),25)};Panel("OWNED GAME SIGNAL","Telemetry",Modifier.weight(1f)){Row(horizontalArrangement=Arrangement.spacedBy(4.dp),verticalAlignment=Alignment.CenterVertically){Node("FSA");Text("→",color=Cyan);Node("EVENTS");Text("→",color=Teal);Node("EGM")};Text("Exact telemetry only from this owned F.S.A. simulation.",color=Muted,fontSize=9.sp)}}}

@Composable private fun LoginPanel(server:String,user:String,pass:String,token:String,onServer:(String)->Unit,onUser:(String)->Unit,onPass:(String)->Unit,onLogin:()->Unit){Panel("PLAYER CHANNEL",if(token.isBlank())"Sign In" else "Authenticated Player"){if(token.isBlank()){OutlinedTextField(server,onServer,label={Text("HTTPS server URL")},singleLine=true,modifier=Modifier.fillMaxWidth());OutlinedTextField(user,onUser,label={Text("Username")},singleLine=true,modifier=Modifier.fillMaxWidth());OutlinedTextField(pass,onPass,label={Text("Password")},singleLine=true,visualTransformation=PasswordVisualTransformation(),modifier=Modifier.fillMaxWidth());Button(onClick=onLogin,colors=ButtonDefaults.buttonColors(containerColor=Orange),modifier=Modifier.fillMaxWidth()){Text("SIGN IN TO F.S.A.")}}else Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){Pill("SECURE",Teal);Text("Player role verified · bearer session active",color=Muted,fontSize=10.sp)}}}

@Composable private fun Loadout(){Panel("LOADOUT BAY","Pulse Cannon Mk VI"){Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(12.dp)){Box(Modifier.size(70.dp).border(2.dp,Gold,RoundedCornerShape(17.dp)).background(Brush.radialGradient(listOf(Cyan.copy(alpha=.45f),Color(0xFF11121A))),RoundedCornerShape(17.dp)),contentAlignment=Alignment.Center){Text("◈",color=Gold,fontSize=38.sp,fontWeight=FontWeight.Black)};Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)){Power("POWER",.78f,Orange);Power("RANGE",.65f,Teal);Power("RATE",.88f,Cyan);Power("CONTROL",.72f,Purple)}};Text("Cannon writes remain server/session-key bounded.",color=Muted,fontSize=9.sp)}}

@Composable private fun Session(mode:String,sid:String?,shots:Int,token:String,onStart:()->Unit,onFire:()->Unit,onEnd:()->Unit){Panel("LIVE TABLE","$mode Session"){Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){Metric("SESSION",if(sid==null)"IDLE" else "ACTIVE",if(sid==null)Gold else Teal,Modifier.weight(1f));Metric("SHOTS",shots.toString(),Cyan,Modifier.weight(1f));Metric("SIGNAL","1.0",Teal,Modifier.weight(1f))};Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){Button(enabled=token.isNotBlank()&&sid==null,onClick=onStart,modifier=Modifier.weight(1f),colors=ButtonDefaults.buttonColors(containerColor=Orange)){Text("NEW")};Button(enabled=sid!=null,onClick=onFire,modifier=Modifier.weight(1f)){Text("FIRE")};OutlinedButton(enabled=sid!=null,onClick=onEnd,modifier=Modifier.weight(1f),border=BorderStroke(1.dp,Color(0xFFFF6675))){Text("END")}}}}

@Composable private fun Panel(kicker:String,title:String,modifier:Modifier=Modifier,content:@Composable ColumnScope.()->Unit){Card(modifier,colors=CardDefaults.cardColors(containerColor=Panel),border=BorderStroke(1.dp,Line),shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){Text(kicker,color=Gold,fontSize=8.sp,fontWeight=FontWeight.Black,letterSpacing=1.sp);Text(title,fontSize=18.sp,fontWeight=FontWeight.Black);content()}}}
@Composable private fun Mode(icon:String,title:String,sub:String,selected:Boolean,modifier:Modifier,onClick:()->Unit){OutlinedButton(onClick,modifier.height(100.dp),border=BorderStroke(1.dp,if(selected)Gold else Line),colors=ButtonDefaults.outlinedButtonColors(containerColor=if(selected)Color(0xFF261709) else Color(0xFF0A2332)),contentPadding=PaddingValues(9.dp)){Column(Modifier.fillMaxWidth(),horizontalAlignment=Alignment.Start){Text(icon,fontSize=27.sp);Text(title,fontSize=10.sp,fontWeight=FontWeight.Black);Text(sub,color=Muted,fontSize=8.sp)}}}
@Composable private fun Mission(label:String,value:Int,max:Int){val p=(value.toFloat()/max.coerceAtLeast(1)).coerceIn(0f,1f);Row{Text(label,fontSize=9.sp,modifier=Modifier.weight(1f));Text("$value / $max",color=Muted,fontSize=9.sp)};LinearProgressIndicator(progress={p},modifier=Modifier.fillMaxWidth().height(5.dp),color=Teal,trackColor=Color(0xFF102A36))}
@Composable private fun Power(label:String,value:Float,color:Color){Row(verticalAlignment=Alignment.CenterVertically){Text(label,color=Muted,fontSize=8.sp,modifier=Modifier.width(58.dp));LinearProgressIndicator(progress={value},modifier=Modifier.weight(1f).height(6.dp),color=color,trackColor=Color(0xFF102A36))}}
@Composable private fun Metric(label:String,value:String,color:Color,modifier:Modifier){Surface(modifier,color=Color(0xFF04121B),shape=RoundedCornerShape(9.dp),border=BorderStroke(1.dp,Line)){Column(Modifier.padding(8.dp)){Text(label,color=color,fontSize=8.sp,fontWeight=FontWeight.Black);Text(value,fontSize=10.sp,fontWeight=FontWeight.Bold,maxLines=2)}}}
@Composable private fun Node(text:String){Box(Modifier.background(Color(0xFF04131C),RoundedCornerShape(8.dp)).border(1.dp,Line,RoundedCornerShape(8.dp)).padding(horizontal=6.dp,vertical=7.dp)){Text(text,color=Cyan,fontSize=7.sp,fontWeight=FontWeight.Black)}}
@Composable private fun Pill(text:String,color:Color){Surface(color=color.copy(alpha=.12f),shape=RoundedCornerShape(99.dp),border=BorderStroke(1.dp,color.copy(alpha=.7f))){Text(text,color=color,fontSize=8.sp,fontWeight=FontWeight.Black,modifier=Modifier.padding(horizontal=7.dp,vertical=4.dp))}}
@Composable private fun Chip(label:String,value:String,color:Color){Surface(color=Color(0xFF081B29),shape=RoundedCornerShape(9.dp),border=BorderStroke(1.dp,Line)){Row(Modifier.padding(horizontal=8.dp,vertical=6.dp),horizontalArrangement=Arrangement.spacedBy(5.dp)){Text(label,color=color,fontSize=8.sp,fontWeight=FontWeight.Black);Text(value,fontSize=9.sp,fontWeight=FontWeight.Bold)}}}
private fun timer(s:Int)="%02d:%02d:%02d".format(s/3600,(s%3600)/60,s%60); private fun fmt(v:Double)=String.format("%,.0f",v)

fun event(sessionId:String,sessionKey:String,userId:String,type:String,payload:JSONObject)=JSONObject().put("schemaVersion","egm4000.gameplay-event.v1").put("eventId","evt-${UUID.randomUUID()}").put("sessionId",sessionId).put("sessionKey",sessionKey).put("userId",userId).put("observedAt",Instant.now().toString()).put("eventType",type).put("payload",payload).put("provenance",JSONObject().put("kind","exact_telemetry").put("source","FSA-SV10-ANDROID").put("confidence",1.0))

class Api{
 fun get(base:String,path:String,token:String?)=request(base.trimEnd('/')+"/api"+path,"GET",null,token)
 fun post(base:String,path:String,b:JSONObject,token:String?)=request(base.trimEnd('/')+"/api"+path,"POST",b,token)
 private fun request(url:String,m:String,b:JSONObject?,token:String?):JSONObject{require(url.startsWith("https://")){"Use an HTTPS server URL"};val c=URL(url).openConnection() as HttpURLConnection;c.requestMethod=m;c.connectTimeout=15000;c.readTimeout=20000;c.setRequestProperty("Content-Type","application/json");if(token!=null)c.setRequestProperty("Authorization","Bearer $token");if(b!=null){c.doOutput=true;c.outputStream.use{it.write(b.toString().toByteArray())}};val t=(if(c.responseCode in 200..299)c.inputStream else c.errorStream).bufferedReader().readText();if(c.responseCode !in 200..299)throw IllegalStateException(t);return JSONObject(t)}
}
