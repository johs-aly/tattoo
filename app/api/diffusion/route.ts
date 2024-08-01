import {RedisUserId} from "@/types/user";
import usersUtil from "@/lib/userUtils";
import {StreamingTextResponse} from "ai";
import {NextApiRequest, NextApiResponse} from "next";
import {NextRequest, NextResponse} from "next/server";

export async function POST(req: NextRequest) {

    const engineId = 'stable-diffusion-v1-6'
    const apiHost = 'https://api.stability.ai'
    const apiKey = "sk-1cwGLpS0K0SXgh3wYNAVwZJECPsOkgVphzEXNiFhTSwYg5Eb"


    const {prompt} = await req.json();
    console.log(prompt)
    // // Verify user token
    const token = req.headers.get('Authorization')?.split(' ')[1];  // Extract from authorization header
    if (!token) {
        return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const userId: RedisUserId = await usersUtil.getUserIdByToken(token);
    if (!userId) {
        return NextResponse.json({ error: '用户未找到' }, { status: 404 });
    }

    // Check daily usage quota
    const remainingInfo = await usersUtil.getUserDateRemaining(userId)
    if (remainingInfo.userDateRemaining <= 0) {
        const errorText = '0 credit remaining today.'
        return new StreamingTextResponse(errorText as any);
    }

    // Generate image using your preferred library (replace with your implementation)
    console.log("sdfsdfsdfdsfds")
    const response = await fetch(
        `${apiHost}/v1/generation/${engineId}/text-to-image`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                text_prompts: [
                    {
                        text: prompt,
                    },
                ],
                cfg_scale: 7,
                height: 1024,
                width: 1024,
                steps: 30,
                samples: 1,
            }),
        })

    const data = await response.json();
    console.log('API response data:', data);
    const imageData = data. artifacts[0].base64;
    //
    // // Update user's remaining quota after successful generation
    await usersUtil.incrAfterChat({userId, remainingInfo});

    return NextResponse.json({ modelOutputs: [{ image_base64: imageData }] }, { status: 200 });
}