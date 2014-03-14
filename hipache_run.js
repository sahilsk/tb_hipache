var fs = require("fs");
var argv = require('optimist').argv;


var USER_CONFIG= "";
var ENVIRONMENT="test";
var VERBOSE="";
var CONFIG="";


//### ENVIRONMENT VARIABLES
var HIPACHE_DIR=process.env.HIPACHE_DIR;

function usage(){
	
	var usage = " \
		usage: \n\
		options \n\
		\t   -h      Show this message\n \
		\t   -c      config file(make sure to mount it first using -v arg)\n \
		\t   -env      (qa/staging/test/integration/development/production\n \
		\t   -v      Verbose\n\
			";
	console.log(usage);
	
}


//## override environment
if( argv.env )
	ENVIRONMENT = argv.env
else if(  process.env.SETTINGS_FLAVOR !== undefined )
	ENVIRONMENT = process.env.SETTINGS_FLAVOR

console.log( "Environment: %s", ENVIRONMENT);

//## CONFIG FILE
var REDIS_ADDR ;
var CONFIG_FILE;

if( process.env.REDIS_PORT_6379_TCP === undefined){
	console.log("Redis address not defined");
	usage();
	process.exit(1);
}else{
	REDIS_ADDR = process.env.REDIS_PORT_6379_TCP;
}


if( ENVIRONMENT.length > 0 ){
	CONFIG_FILE = HIPACHE_DIR+"/config/config_"+ENVIRONMENT+".json";
}else
	CONFIG_FILE = HIPACHE_DIR+"/config/config.json";

//### Overwrite config wtih user defined config file if file exist
if( argv.c !== undefined &&  argv.c.length > 0){
	
	if( fs.existsSync( argv.c) ) {
		CONFIG_FILE = argv.c;
	}else{
		console.log("Config file not found: '%s' ", argv.c);
		usage();
		process.exit(1);
	}

	
}


//console.log("Config file: '%s'", CONFIG_FILE);

//## UPDATE REDIS SERVER ADDRESS IN CONFIG FILE

var REDIS_IP = REDIS_ADDR.split(":")[0];
var REDIS_PORT = REDIS_ADDR.split(":")[1];

console.log("Redis address: %s:%s", REDIS_IP, REDIS_PORT);

//read config file and update redis address and then write
//if user config file then update do the same

var config_data = "";
var config_json = "";
try{
config_data = fs.readFileSync(CONFIG_FILE, 'utf8');
}catch(e){
		console.log("Error reading config file  %s", e);
		process.exit(1);
}
//console.log("File data::::::::" + config_data);

try{
	config_json = JSON.parse( config_data);	
}catch(e){
	console.log("Unable to parse config data: %s", e);
	process.exit(1);
}  


config_json.redisHost = REDIS_IP.toString();
config_json.redisPort = REDIS_PORT;
console.log( "Config file:::::::::: %j", config_json);
//save config_json file
fs.writeFileSync(CONFIG_FILE, JSON.stringify(config_json), "utf-8",function (err) {
  if (err) 
	throw err;
  console.log('Config file saved');

});	


//RUN hipache finally
var spawn = require('child_process').spawn,
	ls    = spawn('node', [ HIPACHE_DIR+"/bin/hipache", "--config", CONFIG_FILE]);

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

ls.on('close', function (code) {
  console.log('child process exited with code ' + code);
});




