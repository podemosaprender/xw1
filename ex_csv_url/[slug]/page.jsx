//INFO: list -> pages
//SEE: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes#generating-static-params
import { mk_params } from '@/lib/fetch-data';

const getParams= mk_params('https://ciam.ambiente.gob.ar/dt_csv.php?dt_id=190', {
		delimiter: ';',
		record_delimiter: '\n\r', //U: solo pasar este parametro si falla autodetect //SEE: https://csv.js.org/parse/options/record_delimiter/
  	columns: true,
  	skip_empty_lines: true,
		slugCols: 'nombre',
	}
);


export default async function Libro({params}) {
	let d= await getParams();
	let este= d.find( r => (r.slug == params.slug) );
	//  {"nombre":"RND La Calera","provincia":"Córdoba","creación":"2009","hectáreas":"13628","ambiente_protegido":"Chaco Seco","slug":"rnd-la-calera"}
	return <div>
		<div>Libro {JSON.stringify(params)} este: {JSON.stringify(este)}</div>
		<ul>
			<li>Nombre: {este.nombre}</li>
			<li>provincia: {este.provincia}</li>
		</ul>
	</div>
}

export const generateStaticParams= async () => { 
	let r= await getParams(); console.log("PARAMS", r); return r; 
};
