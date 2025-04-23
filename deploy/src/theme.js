import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  colors: {
    brand: {
      50: "#f0e4ff",
      100: "#d1b3ff",
      200: "#b282ff",
      300: "#9250ff",
      400: "#7320ff",
      500: "#5a00e6",
      600: "#4500b4",
      700: "#310082",
      800: "#1d0051",
      900: "#0a0021",
    },
  },
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
  },
  styles: {
    global: {
      body: {
        bg: "gray.50",
        color: "gray.800",
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
      },
      variants: {
        solid: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
      },
    },
  },
});

export default theme;
