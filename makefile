CC = emcc

SRC = src/wasm/engine.cpp
OUTPUT_DIR = public/wasm
OUTPUT = $(OUTPUT_DIR)/cgh_wasm.js
INC = -I./third_party/json.hpp -I./third_party/boost_math -I./src/wasm

CFLAGS = -O3 \
         $(INC) \
         -s MODULARIZE=1 \
         -s EXPORT_ES6=1 \
         -s ALLOW_MEMORY_GROWTH=1 \
         --bind

all: $(OUTPUT)

$(OUTPUT): $(SRC)
    mkdir -p $(OUTPUT_DIR)
	$(CC) $(SRC) $(CFLAGS) -o $(OUTPUT)

clean:
	rm -rf $(OUTPUT_DIR)/cgh_wasm.js $(OUTPUT_DIR)/cgh_wasm.wasm
