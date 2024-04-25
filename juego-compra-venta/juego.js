//INFO: el juego de compra venta como componente, lo voy a importar de MDX
'use client'

import React from 'react';
import { useState, useEffect, useCallback } from "react";

import Script from 'next/script'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import {Button} from "@nextui-org/button";
import {Input} from "@nextui-org/input";
import {Slider} from "@nextui-org/react";

//XXX: import {QR} from '@/components/qr';

function P2PCxCuandoPideNUEVA(cx, esIniciadaPorMi, cb) {
	console.log("P2PCxCuandoPide cx", window.cx= cx);

	if (! (esIniciadaPorMi || this.ids_aceptados.indexOf(cx.peer)>-1 || confirm("Aceptar conexión de "+cx.peer))) {
		console.log("P2PCxCuandoPide rechazada", cx.peer);
		cx.close(); return;
	}

	this.P2P_peers[cx.peer]={cx, status: 'iniciando'};

	cx.on('error', (err) => {
		console.log("P2PCx error", err, cx);
		this.P2P_peers[cx.peer].status= 'error '+err;
		this.P2P_peers_status= Object.keys(this.P2P_peers).map(k=> (k+'='+this.P2P_peers[k].status)).join(', '); //TODO: funcion
	});

	cx.on('open', () => {
		console.log("P2PCx open", window.cx= cx);
		this.P2P_peers[cx.peer].status= 'conectado';
		this.P2P_peers_status= Object.keys(this.P2P_peers).map(k=> (k+'='+this.P2P_peers[k].status)).join(', '); //TODO: funcion
		if (this.onData) { this.onData({t: 'cxopen', peer: cx.peer}) }

		if (this.es_organizadora) { //TODO: mover a otro lado! separar
			Object.keys(this.P2P_peers).forEach(k=> {
				var p= this.P2P_peers[k];
				if (p.status=='conectado') {
					p.cx.send({t: 'participantes', d: this.P2P_peers_status});
				}
			});
		}

		cx.on('data', (data) => {
			console.log("P2PCx data", data, window.cx= cx);
			if (typeof(data)=="string") { this.recibi_data= data; } //TODO: separar handler
			else if (data.t=="mensaje") { this.recibi_data= data.texto; }
			else if (data.t=="señalar") { notificar(data.imagen, cx.peer); }
			else if (data.t=="participantes") { this.o_participantes= data.d }
			else { console.error("no se que hacer con mensaje",data); }
			
			if (this.onData) { this.onData(data) }
		});
	});
}

let P2P_
async function P2P(srv_id, mi_id, onData) {
	console.log("P2P",P2P_==null,window.peerjs!=null,window.P2PIniciar!=null)
	if (P2P_==null && window.peerjs && window.P2PIniciar) { //A: no inicialice y tengo todo
		console.log("P2P init",P2P_==null,window.peerjs!=null,window.P2PIniciar!=null)
		P2P_ = {
			onData, //XXX:NUEVO
			P2P: null,
			P2P_status: 'desconectado',
			P2P_peers: {},
			P2P_peers_status: '', //U: para la ui

			es_organizadora: false, //U: para elegir ej. si reenviar chats

			id_deseado: mi_id,
			id_recibido: '',
			id_otro: (srv_id && mi_id != srv_id) ? srv_id : '',
			ids_aceptados: '',

			recibi_data: '',
			mensaje: 'saludos',
			mi_stream_sts: '',
			cx: {}, 

			o_participantes: '',

			quieroOrganizar() { 
				window.xsts= this;
				this.es_organizadora= true;
				var cuandoRecibeLlamada= (sts, _, call) => {
					if (sts=='ring') { return this.P2P_peers[call.peer]!=null } //A: solo atendemos si lo habiamos aceptado
				};
				audioContextInit(); //A: para reenviarle un solo stream a todas las Participantes
				this.P2PIniciar(cuandoRecibeLlamada); 
			},
			quieroParticipar() { 
				window.xsts= this;
				var cuandoTieneP2P= (sts, _, call) => {
					if (sts=='conectado') { this.P2PCxIniciar(); }
					else if (sts=='ring') { return this.P2P_peers[call.peer]!=null } //A: solo atendemos si lo habiamos aceptado
					else { alert('No pude conectar "'+sts+'"'); }
				}
				this.P2PIniciar(null, cuandoTieneP2P);
			},

			capture,

			audioContextInit,
			audioContextConnectStream,
			conseguirAudioContext,
			conseguirNuestroAudioYVideo,
			conseguirNuestroAudio,
			conseguirNuestraPantalla,

			P2PIniciar,

			P2PCxIniciar,

			P2PCxCuandoPide: P2PCxCuandoPideNUEVA,
			enviar,
			compartirMiPantalla,
			P2PCuandoHayLlamada,
			pedirSuPantalla,
			marcarEnSuPantalla,
		}
		window.P2P= P2P_; //DBG:
		console.log("P2P created",P2P_!=null)

		await (new Promise( (onOk) => P2P_.P2PIniciar(null, onOk) )); //XXX:ERROR_HANDLING
		console.log("P2P connected",P2P_!=null)

		if (srv_id) {
			console.log("P2P srv_id",srv_id)
			P2P_.P2PCxIniciar(null, srv_id) //XXX:no llama cb await (new Promise( (onOk) => P2P_.P2PCxIniciar(null, srv_id, onOk))) //XXX:ERROR_HANDLING
		}
	}
	console.log("P2P R",P2P_!=null, srv_id)
	return P2P_;
}

export default function Game() {
	const [nic, nicSet]= useState('');
	const [conectado, conectadoSet]= useState('');
	const [msg, msgSet]= useState('');

	const [msgMio, msgMioSet]= useState('');


	const searchParams= useSearchParams();
	const [mi_id, mi_idSet]= useState(searchParams.get('m') || window.crypto.randomUUID());
	const srv_id= searchParams.get('s');
	const isServer= !srv_id;
	console.log({mi_id, srv_id, isServer})

	const enviar= async (msg, dst) => {
		dst= dst || P2P_.id_otro;
		if (dst=='*') { Object.keys(P2P_.P2P_peers).map( k => enviar(msg,k) ) }
		else {
			let peer= P2P_.P2P_peers[dst];
			peer.cx.send(msg);
		}
	}

	const [idCnt, idCntSet]= useState(1);
	const [ofertas, ofertasSet]= useState([])
	const [saldos, saldosSet]= useState({})
	const [historia, historiaSet]= useState([]);

	const onP2PData= useCallback( (data) => { 
		//DBG: msgSet(JSON.stringify(data)) 
		if (isServer) {
			if (data.t=="cxopen") {
				saldos[data.peer]= 1000;
				saldosSet({...saldos})
				enviar({t: "saldos", saldos},'*')
				historiaSet([...historia, {t: 'saldo', v: saldos[data.peer]}]);
			}
			else if (data.t=="oferta") {
				historiaSet([...historia, data]);

				data.id= idCnt; idCntSet(idCnt+1);
				let o2= [data, ...ofertas];
				console.log("m oferta",o2, ofertas);
				ofertasSet(o2);
				enviar({t: "ofertas", ofertas: o2},'*')
			}
			else if (data.t=="operacion") {
				historiaSet([...historia, data]);

				let o= ofertas.find( o => (o.id == data.id) )
				let sig= o.lado=="compra" ? 1 : -1;
				saldos[o.de]-= Math.trunc(sig * o.precio);
				saldos[data.de]+= Math.trunc(sig*o.precio);
				console.log("OP",{orden_de: o.de, op_de: data.de, precio: o.precio, op: data, o, sig, saldos});
				saldosSet({...saldos});
				enviar({t: "saldos", saldos},'*')

				let o2= ofertas.filter( ox => (ox!=o) )
				ofertasSet(o2);
				enviar({t: "ofertas", ofertas: o2},'*')
			}
		} else { //A: jugadores
			if (data.t=="ofertas") { ofertasSet(data.ofertas); }
			else if (data.t=="saldos") { saldosSet(data.saldos); }
		}
	}, [idCnt, historia, ofertas, saldos]);
	if (P2P_) { P2P_.onData= onP2PData; } //A: react puede regenerar la funcion si cambian las deps

	const connectP2P= () => { if (! conectado ) { P2P(srv_id, mi_id, onP2PData).then( (r) => { 
		console.log("P2P UE",r!=null); conectadoSet(r!=null && r.id_deseado) 
	} ) } };
	window.XP= P2P

	//S: jugador
	const [precio, precioSet]= useState(500);
	const enviarCompra= async () => {
		console.log("enviarCompra",mi_id)
		enviar({t: "oferta", lado: "compra", precio: precio, de: mi_id+'' });
	}

	const enviarVenta= async () => {
		enviar({t: "oferta", lado: "venta", precio: precio, de: mi_id+'' });
	}

	const enviarOperacion= async (op) => {
		enviar({...op, t: "operacion", de: mi_id+'' });
	}

	const ofertasUI= (lado) => ( 
		ofertas
			.filter(o => o.lado==lado)
			.sort( (a,b) => (
				(a.precio==b.precio) ? 0 
				: ( (lado=="compra" ? a.precio<b.precio : b.precio<a.precio) ? 1 : -1 ) ) )
			.slice(0, isServer ? null : 10)
			.map( o => (
				<div>
					<Button onClick={ () => enviarOperacion(o) }>{o.precio}</Button>
					{ isServer ? <span>({o.de})</span> : '' }
				</div>
			)) 
	);

	return (<>
		<Script src="https://unpkg.com/peerjs@1.3.2/dist/peerjs.min.js" onReady={ connectP2P }/>
		<Script src="https://call-s.podemosaprender.org/index.js" onReady={ connectP2P } />
		<div>
			<p>{ 
				(conectado ? "Conectado " : "Esperando conexión ")
					+ (srv_id ? "a "+srv_id : "como servidor "+mi_id)
				}</p>
			<p> <Link href={ window.location.href.replace(/\?.*$/,'')+'?s='+ (srv_id || conectado ) } >Servidor</Link> </p>

			<p>Msg: { msg } </p>
			<Input onValueChange= { v => msgMioSet(v) } placeholder="msg"/>
			<Button onClick={ () => enviar({t: 'texto', texto: msgMio}) }>Enviar</Button>

			<Input onValueChange= { v => nicSet(v) } placeholder="nic"/>

			<div className="grid grid-cols-2 gap-1">	
				<div className="grid grid-cols-1 justify-start">
					<div><p>Compra</p></div>
					{ ofertasUI("compra") }
				</div>
				<div className="grid grid-cols-1 justify-start">
					<div><p>Venta</p></div>
					{ ofertasUI("venta") }
				</div>
			</div>

			{ isServer ? '' : (<>
				<div>
					${saldos[mi_id]}
				</div>

				<Slider 
					label="Precio" 
					value={precio}
					onChange={precioSet}
					step={10} 
					maxValue={1000} 
					minValue={10} 
					defaultValue={500}
					className="max-w-md"
					size="md"
				/>
				<Button onClick={ enviarCompra }>Comprar</Button>
				<Button onClick={ enviarVenta }>Vender</Button>
			</>) }

			{ isServer ? Object.keys(saldos).map( k => (<div>{k}: {saldos[k]}</div>) ) : '' }
			{ isServer ? <Button onClick={ () => console.log(JSON.stringify(historia)) }>Exportar historia</Button> : '' }
			{ isServer 
				? <a
            href={`data:text/json;charset=utf-8,${encodeURIComponent(
              JSON.stringify(historia)
            )}`}
            download="juegohist.json"
          >
            Download History Json
				</a>
				: ''
			}
		</div>
	</>)

}
