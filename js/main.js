
var SAAgent = null;
var SASocket = null;
var CHANNELID = 142;
var tag = "WheelLog";
var ProviderAppName = "WheelLog";

var MilesPerHour 		= {factor:0.62137119, 	label:"MPH"};
var KilometersPerHour 	= {factor:1.0, 			label:"KPH"};
var FeetPerSecond 		= {factor:0.911344, 	label:"FPS"};
var MetersPerSecond 	= {factor:0.27777,		label:"MPS"};

var UnitList = [
                MilesPerHour, 
                KilometersPerHour//, 
                //FeetPerSecond, 
                //MetersPerSecond
                ];


var currentUnit = KilometersPerHour;

function formatSpeed(mpsSpeed ) {
	return parseFloat(currentUnit.factor * mpsSpeed).toPrecision(2) ;
//	return parseFloat(currentUnit.factor * mpsSpeed).toPrecision(2) + " " + currentUnit.label;
	
}

function onerror(error) {
	console.log("ONERROR: err [" + error.name + "] msg [" + error.message + "]");	
}

function onerror1(error) {
	console.log("ONERROR-1: err [" + error.name + "] msg [" + error.message + "]" + error);	
}


var agentCallback = {
	onconnect: function (socket) {
		console.log("agentCallback connect:" + socket);
		SASocket = socket;
		SASocket.setSocketStatusListener(function (reason) {
			disconnect();
			console.log("disconnected");
		});
		SASocket.setDataReceiveListener(onreceive);
	},
	onerror:onerror1
};

var peerAgentFindCallback = {
		onpeeragentfound : function(peerAgent) {
			console.log("peerAgentFindCallback::onpeeragentfound");
			console.log("     peerAgent.appName =:" + peerAgent.appName );
			try {					
				if(peerAgent.appName === ProviderAppName) {
					console.log("setServiceConnectionListener");
					SAAgent.setServiceConnectionListener(agentCallback);
					console.log("requestServiceConnection");
					SAAgent.requestServiceConnection(peerAgent);
				} else {					
				}
			}
			catch(err) {
				console.log("onpeeragentfound exception: [" + err.name + "] msg [" + err.message + "]");
			}
		},
		onerror: function(error) {
			console.log("peerAgentFindCallback error: err [" + error.name + "] msg [" + error.message + "]" + error);	
		}
};

function onsuccess (agents) {
	try {
		console.log("agent count:" + agents.length);
		if(agents.length>0) {
			SAAgent = agents[0];
			SAAgent.setPeerAgentFindListener(peerAgentFindCallback);
			console.log("finding peer agents");
			SAAgent.findPeerAgents();
			console.log("success:" + SAAgent.name + "|" + SAAgent.role);
		} else {
			console.log("onsuccess else");
		}
	}catch(err)  {
		console.log("onsuccess exception [" + err.name + "] msg[" + err.message + "]");
	}
}

function onreceive(channelid, data) {
	
	console.log("received:"+data);
	switch(channelid) {
	case CHANNELID: {
		try {
			var wheelData = jQuery.parseJSON(data);
			$('#textbox1').html( formatSpeed(wheelData.speed));
			$('#textbox2').html( wheelData.batteryLevel + " &percnt;");
			$('#textbox3').html( wheelData.distance );
		}
		catch(e) {
			$('#textbox1').html("bad");
			$('#textbox2').html("data");
			$('#textbox3').html("recvd");
		}
	}
		break;
		default:
			break;
	}	
}

function connect() {
	if(SAAgent) {
		 console.log("reattempting find");
		SAAgent.setPeerAgentFindListener(peerAgentFindCallback);
		SAAgent.findPeerAgents();
		return false;
	}
	try {
		console.log("requesting SAAgent (connect)");
		webapis.sa.requestSAAgent(onsuccess	, onerror);
	} catch(err) {
		console.log("onsuccess exception [" + err.name + "] msg[" + err.message + "]");
	}
}

function applySpeedSetting() {
	var unit = localStorage.getItem('speedUnit');
	if(unit !== null) {
		UnitList.forEach( function(x) {
			if(x.label === unit) {
				currentUnit = x;
				return;
			}			
		});
	}	
}


function disconnect () {
	try {
		if(SASocket !== null) {
			console.log("Disconnecting");
			SASocket.close();
			SASocket = null;
			connect(); //Once disconnected we retry connection (nothing else to do ;-)
		}
	} catch(err) {
		console.log("onsuccess exception [" + err.name + "] msg[" + err.message + "]");
	}
}

function populateUnits() {
	var unitList = document.getElementById('unitsList');
	UnitList.forEach(function(e) {
		var li = document.createElement('li');
		var radio = document.createElement('input');
		var label = document.createElement('label');
				
		radio.setAttribute('type','radio' );
		radio.setAttribute('name', 'units');
		radio.setAttribute('value', e.label);
		radio.setAttribute('id', 'unit_' + e.label);
		if(e.label === currentUnit.label)
			radio.setAttribute('checked','true');
		radio.setAttribute('onclick', 'setUnit("'+ e.label + '");');
		
		label.innerText = e.label;
		label.setAttribute('for', 'unit_', e.label );
		label.innerText = e.label;
		
		li.appendChild(radio);
		li.appendChild(label);		
		radio.setAttribute('href','#');
		unitList.appendChild(li);		
	});		
}


function setUnit(unit ) {
	localStorage.setItem("speedUnit", unit);
	applySpeedSetting();
}


$(window).load(function(){
	document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName === "back") {
        	var currentPage = document.getElementsByClassName('ui-page-active')[0];
        	var pageId = (currentPage)?currentPage.id:' ';
        	if(pageId ==='main')
        		tizen.application.getCurrentApplication().exit();
        	else {
        		tau.changePage("#main");
        	}
        		//window.history.back();        		
        }
    });
	tau.defaults.pageTransition = "slideup";
	//Locking the display backlight. Intento fallido
	//int result = DEVICE_ERROR_NONE;
	//The second parameter is lock timeout in milliseconds. Zero means permanent lock.
	//result = device_power_request_lock(POWER_LOCK_DISPLAY, 0);	
	//Otro intento fallido
	//Request("SCREEN","SCREEN_NORMAL");
	try {
		tizen.power.request("SCREEN", "SCREEN_NORMAL");
        console.log ("Success setting screen normal");
	} catch (e) {
		// TODO: handle exception
		console.log("onsuccess exception [" + err.name + "] msg[" + err.message + "]");
	}
	
	console.log('Using Accessory SDK');
	connect();
	populateUnits();
	applySpeedSetting();
});