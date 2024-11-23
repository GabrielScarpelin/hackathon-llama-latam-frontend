"use client";

import FastButton from "@/components/FastButtonAi";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col p-10 h-full">
        <div className="flex justify-between">
            <div>
                <span>
                  <h1 className="text-3xl text-[#393E41] font-bold">Olá, Gabriel Scarpelin Diniz 👋</h1>
                </span>
                <h2 className="text-gray-600 font-bold text-2xl mt-3">
                    Sobre o que vamos aprender hoje?
                </h2>
            </div>
            <Link href="/profile">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_9_175)">
                        <path fillRule="evenodd" clipRule="evenodd" d="M24 24C18.6804 24 14.3543 19.6944 14.3543 14.4C14.3543 9.10557 18.6804 4.79997 24 4.79997C29.3196 4.79997 33.6457 9.10557 33.6457 14.4C33.6457 19.6944 29.3196 24 24 24ZM33.0622 25.6151C36.8891 22.5503 39.1197 17.5942 38.2998 12.1678C37.3473 5.87264 32.0856 0.835145 25.7339 0.100745C16.9683 -0.914456 9.53146 5.87757 9.53146 14.4C9.53146 18.936 11.6439 22.9775 14.9379 25.6151C6.84512 28.6415 0.937112 35.748 0.0111218 45.3384C-0.123917 46.7568 0.987762 48 2.42015 48C3.64757 48 4.69413 47.0784 4.80265 45.8616C5.76963 35.1504 14.0095 28.8 24 28.8C33.9906 28.8 42.2304 35.1504 43.1974 45.8616C43.3059 47.0784 44.3525 48 45.5799 48C47.0123 48 48.1239 46.7568 47.9889 45.3384C47.0629 35.748 41.1549 28.6415 33.0622 25.6151Z" fill="black"/>
                    </g>
                    <defs>
                        <clipPath id="clip0_9_175">
                            <rect width="48" height="48" fill="white"/>
                        </clipPath>
                    </defs>
                </svg>

            </Link>
        </div>
        <div className="my-auto">
            <p className="text-lg text-center mb-4">Gere conteúdos dinamicamente com inteligência artificial para turbinar o seu aprendizado e o do seu filho em libras.</p>
            <div className="input rounded-full border-[#656565] border-2 px-4">
                <div className="flex w-full gap-4">
                    <div>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={39}
                            height={38}
                            fill="none"
                            transform="scale(0.8)"
                        >
                            <path
                            stroke="#656565"
                            strokeLinecap="round"
                            strokeWidth={3}
                            d="M13 16.625h13M13 22.167h8.938M27.625 5.285A16.503 16.503 0 0 0 19.5 3.167C10.525 3.167 3.25 10.255 3.25 19c0 2.533.61 4.927 1.696 7.05.288.564.384 1.209.217 1.818l-.968 3.524c-.42 1.53 1.016 2.93 2.587 2.52l3.617-.942c.625-.163 1.287-.07 1.866.211a16.532 16.532 0 0 0 7.235 1.652c8.974 0 16.25-7.089 16.25-15.833 0-2.884-.791-5.588-2.174-7.917"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Digite aqui..."
                        className="border-none outline-none w-full"
                    />
                    <button>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={40}
                            height={40}
                            fill="none"
                            transform="scale(0.8)"
                            className="hover:scale-90 hover:bg-gray-200 rounded-full transition-all"
                        >
                            <path
                            stroke="#656565"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M19.167 20H9.031m-.287 1.329L7.069 26.33c-.917 2.74-1.375 4.11-1.046 4.953a2.5 2.5 0 0 0 1.657 1.5c.872.243 2.19-.35 4.824-1.535l16.89-7.601c2.572-1.158 3.858-1.736 4.255-2.54a2.5 2.5 0 0 0 0-2.216c-.397-.804-1.683-1.383-4.255-2.54l-16.92-7.614c-2.626-1.182-3.94-1.773-4.81-1.53a2.5 2.5 0 0 0-1.658 1.495c-.33.842.124 2.21 1.03 4.943L8.748 18.8c.156.47.234.704.265.944.027.213.027.429-.001.642-.032.24-.11.474-.267.944Z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
                <FastButton text="Móveis da casa" onClick={() => {}} />
            </div>
        </div>
    </div>
  );
}
