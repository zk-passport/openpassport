import React, { useState } from 'react'
import { AnimatePresence } from '@tamagui/animate-presence'
import { ArrowLeft, ArrowRight } from '@tamagui/lucide-icons'
import { Button, Image, XStack, YStack, styled, Text } from 'tamagui'
import { textColor1, textColor2 } from '../utils/colors'

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
    width?: number | string;
    onSlideChange?: (index: number) => void;
}

export function Carousel({ images, height = 300, width = "100%", onSlideChange }: CarouselProps) {
    const [[page, going], setPage] = useState([0, 0])

    const imageIndex = wrap(0, images.length, page)
    const paginate = (going: number) => {
        const newPage = page + going
        setPage([newPage, going])
        onSlideChange?.(newPage)
    }

    const isFirstImage = imageIndex === 0
    const isLastImage = imageIndex === images.length - 1
    const slideTexts = [
        { header: "Follow this guide carefully", subtitle: "" },
        { header: "1. Remove your phone case", subtitle: "If your phone does not have a case, you can skip this step." },
        { header: "2. Open your passport on the last page", subtitle: "" },
        { header: "3. Put your phone on the passport", subtitle: "Press the top half of your phone against the last page of the passport, as in the image." },
        { header: "4. Start scanning", subtitle: "Press Start NFC Scan and follow the on-screen instructions." },
        // { header: "4. In case phone doesn't vibrates", subtitle: "If scanning fails to start, slowly move your phone around the open passport, keeping them pressed close together, until it vibrates and scanning starts. You may need to remove your case." },
        // Add more objects as needed
    ]

    const currentSlide = slideTexts[imageIndex] || { header: "No header", subtitle: "No subtitle for this slide" }

    return (
        <YStack>
            <XStack
                overflow="hidden"
                backgroundColor="#000"
                position="relative"
                height={height}
                width={width}
                alignItems="center"
                borderRadius="$10"
            >
                <AnimatePresence initial={false} custom={{ going }}>
                    <GalleryItem key={page} animation="medium" going={going}>
                        <Image source={{ uri: images[imageIndex] }} width={width} height={height} resizeMode="contain" />
                    </GalleryItem>
                </AnimatePresence>

                {!isFirstImage && (
                    <Button
                        accessibilityLabel="Carousel left"
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
                {!isLastImage && (
                    <Button
                        accessibilityLabel="Carousel right"
                        icon={ArrowRight}
                        size="$5"
                        position="absolute"
                        right="$4"
                        circular
                        elevate
                        onPress={() => paginate(1)}
                        zi={100}
                    />
                )}
            </XStack>
            <YStack mt="$2" ai="center">
                <Text color={textColor1} fontSize="$8" fontWeight="bold" mt="$0" textAlign='center'>{currentSlide.header}</Text>
                <Text color={textColor2} fontSize="$6" mt="$1" textAlign='center'>{currentSlide.subtitle}</Text>
            </YStack>

        </YStack>
    )
}
