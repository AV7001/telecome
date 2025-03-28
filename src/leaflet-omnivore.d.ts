declare module 'leaflet-omnivore' {
    import * as L from 'leaflet';
    const omnivore: {
        kml: {
            parse: (data: string | Blob, options?: any) => L.Layer;
        };
    };
    export default omnivore;
}
