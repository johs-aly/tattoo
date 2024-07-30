"use client";

import DropDown, {StyleType} from "@/components/DropDown";
import Subscribe from "@/components/subscribe/Subscribe";
import {siteConfig} from "@/config/site";
import {formatNumber} from "@/lib/data";
import {UserInfo} from "@/types/user";
import {useCompletion} from "ai/react";
import dayjs from "dayjs";
import Image from "next/image";
import Link from "next/link";
import {FormEvent, useCallback, useEffect, useRef, useState} from "react";
import {Toaster, toast} from "react-hot-toast";
import {StreamingTextResponse} from "ai";

interface HomePageProps {
    usage: number;
    user: UserInfo | null;
    remaining: number;
    boostPackRemaining: number;
    membershipExpire: number;
    boostPackExpire: number;
}

export default function HomePage({
                                     usage,
                                     user,
                                     remaining,
                                     boostPackRemaining,
                                     membershipExpire,
                                     boostPackExpire,
                                 }: HomePageProps) {
    const [currentUses, setCurrentUses] = useState(0);
    const [remainingCredits, setRemainingCredits] = useState(0);
    const [boostPackRemainingCredits, setBoostPackRemainingCredits] = useState(0);
    const [content, setContent] = useState("");
    const [style, setStyle] = useState<StyleType>("Neo-Traditional"); // 更新为风格类型
    const answerRef = useRef<null | HTMLDivElement>(null);
    const [prompt, setPrompt] = useState("");
    const [image, setImage] = useState();
    const [loading, setLoading] = useState(false);

    const scrollToAnswer = () => {
        if (answerRef.current !== null) {
            answerRef.current.scrollIntoView({behavior: "smooth"});
        }
    };

    const {complete, completion, isLoading, handleSubmit} = useCompletion({
        api: "/api/completion",
        body: {
            prompt: content,
        },
        headers: {
            token: user?.accessToken || "",
        },
        onResponse: (res) => {
            if (res.status === 429) {
                toast.error("You are being rate limited. Please try again later.");
                return;
            }
            setCurrentUses((pre) => pre + 1);
            scrollToAnswer();
        },
    });

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value),
        []
    );

    const onSubmit = async (e: FormEvent<HTMLFormElement>) => {

        e.preventDefault();
        setLoading(true);

        // 判断token是否存在
        // Verify if token exists
        // const token = user?.accessToken
        // if (!token) {
        //     const errorText = 'Token validation failed. Please login again.'
        //     return new StreamingTextResponse(errorText as any);
        // }

        // Create prompt with selected style
        const styledPrompt = `Generate a ${style} style tattoo with the following description: ${content}`;


        try {
            const response = await fetch("/api/diffusion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization: `Bearer ${token}`, // Include token in request
                },
                body: JSON.stringify({prompt: styledPrompt}),
            });

            const data = await response.json();
            setLoading(false);
            setImage(data.modelOutputs[0].image_base64);

            setCurrentUses((pre) => pre + 1);
            scrollToAnswer();
        } catch (error) {
            console.error("Error generating image:", error);
            setLoading(false);
            toast.error("An error occurred. Please try again later.");
        }
    };

    const answer = completion;

    useEffect(() => {
        if (currentUses <= remaining) {
            setRemainingCredits(remaining - currentUses);
            setBoostPackRemainingCredits(boostPackRemaining);
        } else {
            setBoostPackRemainingCredits(
                boostPackRemaining - (currentUses - remaining)
            );
        }
    }, [remaining, boostPackRemaining, currentUses]);

    // 新的处理点击事件的函数
    const handleDivClick = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        // 将 MouseEvent 转换为 FormEvent
        onSubmit(e as unknown as FormEvent<HTMLFormElement>);
    };


    return (
        <>
            <h1 className="sm:text-6xl text-4xl max-w-[708px] font-bold text-slate-900">
                {siteConfig.description}
            </h1>

            <div onClick={handleDivClick}>aaa</div>

            <form className="max-w-xl w-full" onSubmit={onSubmit}>
                <div className="flex mt-10 items-center space-x-3">
                    <Image src="/1-black.png" width={30} height={30} alt="1 icon"/>
                    <p className="text-left font-medium">
                        Describe your tattoo.
                    </p>
                </div>
                <textarea
                    value={content}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full rounded-md bg-white border border-gray-300 shadow-sm focus:border-black focus:ring-black my-5 px-2 py-1"
                    placeholder={"e.g. Identify gender based on ID card."}
                />
                <div className="flex mb-5 items-center space-x-3">
                    <Image src="/2-black.png" width={30} height={30} alt="1 icon"/>
                    <p className="text-left font-medium">Pick a style.</p>
                </div>
                <div className="block">
                    <DropDown
                        style={style} // 传递当前选中的风格
                        setStyle={(newStyle) => setStyle(newStyle)} // 更新选中的风格
                    />
                </div>

                {user ? (
                    <>
                        <div className="text-left mt-6 mb-2 text-gray-500 text-sm">
                            <div>
                                {remainingCredits <= 0 ? 0 : remainingCredits} credits remaining
                                <>
                                    {membershipExpire ? (
                                        <>
                                            (Membership Expires on:{" "}
                                            {dayjs(membershipExpire).format("YYYY-MM-DD HH:mm")})
                                        </>
                                    ) : (
                                        <></>
                                    )}
                                </>
                            </div>
                        </div>

                        <button
                            className="bg-black rounded-xl text-white font-medium px-4 py-2 hover:bg-black/80 w-full"
                            type="submit"
                            disabled={
                                isLoading || remainingCredits + boostPackRemainingCredits <= 0
                            }
                            style={{
                                cursor:
                                    isLoading || remainingCredits + boostPackRemainingCredits <= 0
                                        ? "not-allowed"
                                        : "",
                            }}
                        >
                            {isLoading ? (
                                <span className="loading">
                  <span style={{backgroundColor: "white"}}/>
                  <span style={{backgroundColor: "white"}}/>
                  <span style={{backgroundColor: "white"}}/>
                </span>
                            ) : remainingCredits + boostPackRemainingCredits <= 0 ? (
                                <Link
                                    href={
                                        user.role === 0 ? "/#subscription-card" : "/#bootsPack-card"
                                    }
                                >
                                    {
                                        /**
                                         * 普通用户的引导文字：引导购买会员
                                         * 会员用户的引导文字：引导购买加油包
                                         * Prompt for regular users: Guide to purchase membership
                                         * Prompt for member users: Guide to purchase a boost package
                                         */
                                        user.role === 0
                                            ? "Become a member to enjoy 500 credits every day."
                                            : "Purchase a Boost Pack to get more credits right now."
                                    }
                                </Link>
                            ) : (
                                <span>Generate Tattoo &rarr;</span>
                            )}
                        </button>
                    </>
                ) : (
                    <Link href="/login">
                        <button
                            className="bg-black rounded-xl text-white font-medium px-4 py-2 sm:mt-10 mt-8 hover:bg-black/80 w-full">
                            <span>Available after logging in &rarr;</span>
                        </button>
                    </Link>
                )}
            </form>
            <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{duration: 2000}}
            />
            <hr className="h-px bg-gray-700 border-1"/>
            <output className="space-y-10 my-10">
                {image && (
                    <>
                        <div className="mt-10">
                            <Image
                                src={`data:image/png;base64,${image}`} // 假设生成的图片是 PNG 格式
                                alt="Generated tattoo"
                                width={600} // 根据实际图片大小调整
                                height={600}
                            />
                        </div>
                    </>
                )}
            </output>

            {/* subscribe */}
            <Subscribe user={user}/>
        </>
    );
}
