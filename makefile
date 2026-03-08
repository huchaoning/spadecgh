CC = emcc

SRC = src/wasm/engine.cpp
OUTPUT = public/wasm/cgh_wasm.js
INC = -I./third_party/boost_math -I./src/wasm

CFLAGS = -O3 \
         -s WASM=1 \
         -s MODULARIZE=1 \
         -s EXPORT_NAME='InitModule' \
         -s ALLOW_MEMORY_GROWTH=1 \
         --bind

all: $(OUTPUT)
