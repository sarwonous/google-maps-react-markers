import { arrayOf, func, node, number, object, oneOfType } from 'prop-types'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { isArraysEqualEps } from '../utils/utils'
import MapMarkers from './markers'

const EPS = 0.00001

const MapComponent = ({ children, style, defaultCenter, defaultZoom, onGoogleApiLoaded, onChange, onDrag, options }) => {
	const mapRef = useRef(null)
	const prevBoundsRef = useRef(null)
	const [map, setMap] = useState(null)
	const [maps, setMaps] = useState(null)
	const [googleApiCalled, setGoogleApiCalled] = useState(false)

	const onIdle = useCallback(() => {
		const zoom = map.getZoom()
		const bounds = map.getBounds()
		const centerLatLng = map.getCenter()

		const ne = bounds.getNorthEast()
		const sw = bounds.getSouthWest()
		const boundsArray = [sw.lng(), sw.lat(), ne.lng(), ne.lat()]

		if (!isArraysEqualEps(boundsArray, prevBoundsRef.current, EPS)) {
			if (onChange) {
				onChange({
					zoom,
					center: [centerLatLng.lng(), centerLatLng.lat()],
					bounds,
				})
			}
			prevBoundsRef.current = boundsArray
		}
	}, [map, onChange])

	const onDragEvent = useCallback(() => {
		if (map.getZoom) {
			const zoom = map.getZoom()
			const bounds = map.getBounds()
			const centerLatLng = map.getCenter()
			if (onDrag) {
				onDrag({
					zoom,
					center: [centerLatLng.lng(), centerLatLng.lat()],
					bounds,
				})
			}
		}
	}, [map, onDrag])

	useEffect(() => {
		if (mapRef.current && !map) {
			setMap(
				new window.google.maps.Map(mapRef.current, {
					center: defaultCenter,
					zoom: defaultZoom,
					...options,
				})
			)
			setMaps(window.google.maps)
		}
	}, [defaultCenter, defaultZoom, map, mapRef, options])

	useEffect(() => {
		if (map) {
			if (!googleApiCalled) {
				onGoogleApiLoaded({ map, maps, ref: mapRef.current })
				setGoogleApiCalled(true)
			}

			window.google.maps.event.clearListeners(map, 'idle')
			// Idle event is fired when the map becomes idle after panning or zooming.
			window.google.maps.event.addListener(map, 'idle', onIdle)

			window.google.maps.event.clearListeners(map, 'drag')

			window.google.maps.event.addListener(map, 'drag', onDragEvent)
		}
	}, [googleApiCalled, map, maps, onChange, onGoogleApiLoaded, onIdle, onDragEvent])

	useEffect(() => {
		// clear listeners on unmount
		return () => {
			if (map) {
				window.google.maps.event.clearListeners(map, 'idle')
				window.google.maps.event.clearListeners(map, 'drag')
			}
		}
	}, [map])

	return (
		<React.Fragment>
			<div ref={mapRef} style={style} className="google-map" />
			{children && map && maps && (
				<MapMarkers map={map} maps={maps}>
					{children}
				</MapMarkers>
			)}
		</React.Fragment>
	)
}

MapComponent.defaultProps = {
	style: {
		width: '100%',
		height: '100%',
		left: 0,
		top: 0,
		margin: 0,
		padding: 0,
		position: 'absolute',
	},
	onGoogleApiLoaded: () => {},
	onChange: () => { },
	onDrag: () => { },
	options: {},
}

MapComponent.propTypes = {
	/**
	 * The Markers on the Map.
	 */
	children: oneOfType([arrayOf(node), node]),
	style: object,
	defaultCenter: object.isRequired,
	defaultZoom: number.isRequired,
	onGoogleApiLoaded: func,
	onChange: func,
	options: object,
	onDrag: func
}

export default MapComponent
