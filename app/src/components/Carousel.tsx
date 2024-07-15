import React, { useState } from 'react'
import { AnimatePresence } from '@tamagui/animate-presence'
import { ArrowLeft, ArrowRight } from '@tamagui/lucide-icons'
import { Button, Image, XStack, YStack, styled, Text } from 'tamagui'
import { borderColor, textColor1, textColor2 } from '../utils/colors'

const GalleryItem = styled(YStack, {
    zIndex: 1,
    x: 0,
    opacity: 1,
    fullscreen: true,

    variants: {
        going: {
            ':number': (going) => ({
                enterStyle: {
                    x: going > 0 ? 1000 : -1000,
                    opacity: 0,
                },
                exitStyle: {
                    zIndex: 0,
                    x: going < 0 ? 1000 : -1000,
                    opacity: 0,
                },
            }),
        },
    } as const,
})

const wrap = (min: number, max: number, v: number) => {
    const rangeSize = max - min
    return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min
}

interface CarouselProps {
    images: string[];
    height?: number;
    onSlideChange?: (index: number) => void;
    handleNfcScan?: () => void;
}

export function Carousel({ images, height = 300, onSlideChange, handleNfcScan }: CarouselProps) {
    const [[page, going], setPage] = useState([0, 0])

    const imageIndex = wrap(0, images.length, page)
    const paginate = (going: number) => {
        const newPage = page + going
        setPage([newPage, going])
        onSlideChange?.(newPage)
    }

    const isLastImage = imageIndex === images.length - 1
    const slideTexts = [
        { header: "Verify your passport using NFC", subtitle: "Follow this guide carefully", acknowledgment: "I'm ready to start" },
        { header: "1. Remove your phone case", subtitle: "If your phone does not have a case, you can skip this step.", acknowledgment: "I have removed my phone case" },
        { header: "2. Open your passport on the last page", subtitle: "", acknowledgment: "I have opened my passport on the last page" },
        { header: "3. Put your phone on the passport", subtitle: "Press your phone against the last page of the passport as in the image.", acknowledgment: "I have placed my phone on the passport" },
        { header: "4. Start scanning", subtitle: "Press Start NFC Scan and follow the on-screen instructions.", acknowledgment: "Start scanning" },
    ]

    const currentSlide = slideTexts[imageIndex] || { header: "No header", subtitle: "No subtitle for this slide", acknowledgment: "Continue" }

    return (
        <YStack f={1} >
            <XStack
                overflow="hidden"
                backgroundColor="#000"
                position="relative"
                height={height}
                alignItems="center"
                borderRadius="$10"
            >
                <AnimatePresence initial={false} custom={{ going }}>
                    <GalleryItem key={page} animation="medium" going={going}>
                        <Image source={{ uri: images[imageIndex] }} height={height} resizeMode="contain" />
                    </GalleryItem>
                </AnimatePresence>

                {imageIndex > 0 && (
                    <Button
                        icon={ArrowLeft}
                        size="$5"
                        position="absolute"
                        left="$4"
                        circular
                        elevate
                        onPress={() => paginate(-1)}
                        zi={100}
                    />
                )}
            </XStack>
            <YStack mt="$2" ai="center">
                <Text color={textColor1} fontSize="$8" fontWeight="bold" mt="$0" textAlign='center'>{currentSlide.header}</Text>
                <Text color={textColor2} fontSize="$6" mt="$1" textAlign='center'>{currentSlide.subtitle}</Text>
            </YStack>
            <XStack f={1} />

            <Button
                borderWidth={1.3}
                borderColor={borderColor}
                borderRadius="$10"
                bg="#3185FC"
                mb="$4"
                h="fit"
                minHeight="$3"
                py="$3"
                onPress={isLastImage ? handleNfcScan : () => paginate(+1)}
            >
                <Text
                    color={textColor1}
                    fontSize="$7"
                    textAlign="center"
                >
                    {currentSlide.acknowledgment}
                </Text>
            </Button>
        </YStack>
    )
}