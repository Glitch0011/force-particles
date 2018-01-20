uniform vec2 resolution;
uniform vec2 forceResolution;

uniform sampler2D textureForce;

uniform vec2 lastMousePos;
uniform vec2 nowMousePos;

uniform float brushSize;
uniform float brushRandom;

uniform float maxSpeed;

float snoise(vec2 co)
{
	return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main()	
{
	vec2 uv = gl_FragCoord.xy / forceResolution.xy;
	
	vec2 data = texture2D(textureForce, uv).xy;
	
	float dist = length(uv - lastMousePos);

	dist = clamp(dist, 0.0, 5.0);
	
	if (dist < brushSize)
	{
		vec2 diff = normalize(nowMousePos - lastMousePos);

		float angle = atan(diff.x, diff.y);

		angle += (-1.0 + snoise(vec2(uv.x, uv.y)) * 2.0) * brushRandom;

		diff = vec2(sin(angle), cos(angle));

		data += diff * (brushSize - dist) * 10.0;
		
		data += normalize(uv - nowMousePos) * 0.01;
		
		data = normalize(data);
	}
	
	gl_FragColor = vec4(data, 0.0, 1.0);
}