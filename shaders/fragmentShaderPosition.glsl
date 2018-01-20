uniform vec2 resolution;
uniform vec2 forceResolution;

uniform float time;
uniform float delta;
uniform sampler2D textureVelocity;
uniform sampler2D texturePosition;
uniform sampler2D textureForce;

uniform float maxSpeed;

void main()	
{
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	
	vec4 data = texture2D(texturePosition, uv).xyzw;
	
	vec2 position = data.xy;
	vec2 velocity = data.zw;

	{
		vec2 gridPos = position + (forceResolution / 2.0);
		if (gridPos.x > 0.0 && gridPos.x < forceResolution.x && gridPos.y > 0.0 && gridPos.y < forceResolution.y)
		{
			velocity += texture2D(textureForce, gridPos.xy / forceResolution.xy).xy;
		}
		else
		{
			vec2 central = vec2(0.0, 0.0);
			vec2 dir = central - position;
			velocity += normalize(dir);
		}
		
		float mag = length(velocity);
		if (mag > maxSpeed)
		{
			velocity = normalize(velocity) * maxSpeed;
		}
	}
	
	gl_FragColor = vec4(position + (velocity * delta), velocity.xy);
}