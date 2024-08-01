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

export default function  HomePage({
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
        const token = user?.accessToken
        if (!token) {
            const errorText = 'Token validation failed. Please login again.'
            return new StreamingTextResponse(errorText as any);
        }

        // Create prompt with selected style
        const styledPrompt = `Generate a tattoo design in the ${style} style. 
        This design is intended for a tattoo studio to use for a custom tattoo. 
        With the following description: ${content}. Please generate only the tattoo design, without any additional content.`;


        try {
            const response = await fetch("/api/diffusion", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`, // Include token in request
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


    return (
        <>
            <h1 className="text-5xl font-bold text-slate-900 mb-8 mt-12">
                {siteConfig.description}
            </h1>

            <div className="flex overflow-x-auto gap-4 mb-8">
                <Image
                    src="/a.png"
                    alt="Tattoo Design 1"
                    width={123}
                    height={123}
                    className="w-full h-auto object-cover"
                />
                <Image
                    src="/b.png"
                    alt="Tattoo Design 2"
                    width={123}
                    height={123}
                    className="w-full h-auto object-cover"
                />
                <Image
                    src="/c.png"
                    alt="Tattoo Design 3"
                    width={123}
                    height={123}
                    className="w-full h-auto object-cover"
                />
                <Image
                    src="/d.png"
                    alt="Tattoo Design 4"
                    width={123}
                    height={123}
                    className="w-full h-auto object-cover"
                />
            </div>

            <p className="text-lg text-gray-700 mb-8 text-center max-w-prose mx-auto">
                If you have a tattoo idea but can't find the right design, let our AI quickly generate a range of tattoo
                concepts for you. Customize the design to match your preferences and explore endless options.
            </p>


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
                    placeholder={"Describe the tattoo you want"}
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
                <div className="relative">
                    {loading && (
                        <div
                            className="w-[600px] h-[600px] border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                            <p className="text-gray-500">Loading...</p>
                        </div>
                    )}
                    {image && !loading && (
                        <div
                            className="w-[600px] h-[600px] border-2 border-gray-300 bg-gray-100 flex items-center justify-center">
                            <Image
                                src={`data:image/png;base64,${image}`}
                                alt="Generated tattoo"
                                width={600}
                                height={600}
                            />
                        </div>
                    )}
                </div>
            </output>

            <section className="max-w-8xl mx-auto mt-16 px-4 mb-16 bg-blue-100 py-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-8">Recent Tattoo Designs</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <div className="overflow-hidden rounded-lg shadow-md">
                        <img src="1.png" alt="Recent Tattoo Design 1"
                             className="w-full h-full object-cover"/>
                    </div>
                    <div className="overflow-hidden rounded-lg shadow-md">
                        <img src="2.png" alt="Recent Tattoo Design 2"
                             className="w-full h-full object-cover"/>
                    </div>
                    <div className="overflow-hidden rounded-lg shadow-md">
                        <img src="3.png" alt="Recent Tattoo Design 3"
                             className="w-full h-full object-cover"/>
                    </div>
                    <div className="overflow-hidden rounded-lg shadow-md">
                        <img src="4.png" alt="Recent Tattoo Design 4"
                             className="w-full h-full object-cover"/>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="max-w-7xl mx-auto mt-16 px-4 mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Questions</h2>
                <div className="space-y-8">
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">How does the AI-powered tattoo
                            generator work?</h3>
                        <p className="text-gray-700">
                            Our AI-powered tattoo generator acts as your virtual tattoo artist. Simply describe your
                            ideal tattoo in the input field, and watch as our system crafts a design based on your
                            description. It’s like having a conversation with a skilled tattooist who brings your ideas
                            to life with cutting-edge technology.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">What details should I include for the
                            AI to design my tattoo?</h3>
                        <p className="text-gray-700">
                            The more detailed you are, the better the design will match your vision. Share specifics
                            about your desired tattoo, including elements, themes, and colors. Additionally, you can
                            select styles and color options to tailor the design to your preferences.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Can I make changes to the AI-generated
                            tattoo designs?</h3>
                        <p className="text-gray-700">
                            Absolutely! The designs created by our AI are a starting point. You can modify and refine
                            them to suit your taste. Feel free to experiment with different elements and make
                            adjustments to ensure the final design is perfect for you.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">How unique are the tattoos generated by
                            the AI?</h3>
                        <p className="text-gray-700">
                            Each tattoo generated by our AI is one-of-a-kind. Our system creates original designs from
                            scratch, ensuring that your tattoo is unique and distinct. No design is ever repeated, so
                            you get a truly unique piece of art.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Can the AI generate tattoos in
                            different styles?</h3>
                        <p className="text-gray-700">
                            Yes, our AI is proficient in a variety of tattoo styles. Whether you prefer classic, modern,
                            geometric, or watercolor styles, the AI can generate designs that fit your chosen style.
                            It’s like having a versatile tattoo studio at your fingertips.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Is it possible to preview the tattoo on
                            my body?</h3>
                        <p className="text-gray-700">
                            Currently, we do not offer a feature to preview tattoos on your body. However, we are
                            developing a virtual try-on tool that will let you see how designs look on your skin. Stay
                            tuned for future updates on this feature.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">How can I request modifications to a
                            design?</h3>
                        <p className="text-gray-700">
                            You can generate multiple designs to find one you like. If the initial design isn't quite
                            right, adjust your description and try again. Providing clear and detailed descriptions will
                            help the AI produce designs closer to your vision.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Are my designs kept private?</h3>
                        <p className="text-gray-700">
                            On the basic plan, your designs are visible in our public gallery. To keep your creations
                            private, consider upgrading to our pro plan, which offers privacy for your designs and keeps
                            them secure from public view.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                    <div className="text-left pb-4">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">Do you have a random tattoo
                            generator?</h3>
                        <p className="text-gray-700">
                            While we don’t have a random tattoo generator per se, we offer a "surprise me" feature for
                            style selection. This option introduces an element of chance, providing unexpected and
                            exciting designs based on your input.
                        </p>
                        <div className="border-t border-gray-300 mt-4"></div>
                    </div>
                </div>
            </section>

            {/* subscribe */}
            <Subscribe user={user}/>
        </>
    );
}
