import {
  VStack,
  Heading,
  Input,
  FormLabel,
  Select,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { invoke } from "@tauri-apps/api/tauri";
import { useEffect, useState } from "react";

interface Settings {
  vol_sample_time: number;
  midi_devices: string[];
}

export default function App() {
  const [data, setData] = useState<Settings | null>(null);
  useEffect(() => {
    invoke("get_settings").then((raw_data) => {
      const data = raw_data as Settings;
      setData(data);
      setSpeed(data.vol_sample_time.toString());
    });
  }, []);

  const [speed, setSpeed] = useState("");
  const [source, setSource] = useState(0);

  return (
    <VStack p="2" gap="4">
      <Heading textAlign="center" p="8">
        Settings
      </Heading>
      {data ? (
        <Inputs
          speed={speed}
          options={data.midi_devices}
          onSpeedChange={setSpeed}
          source={source}
          onSourceChange={setSource}
        />
      ) : (
        <Spinner />
      )}
      <Button
        colorScheme="blue"
        onClick={() => {
          invoke("set_settings", {
            deviceIndex: source,
            sampleTime: parseInt(speed),
          });
        }}
      >
        Save
      </Button>
    </VStack>
  );
}

function Inputs(props: {
  speed: string;
  onSpeedChange: (speed: string) => void;
  source: number;
  onSourceChange: (source: number) => void;
  options: string[];
}) {
  return (
    <>
      <FormLabel w="65%">
        Set Volume Time Speed (milliseconds)
        <Input
          value={props.speed}
          onChange={(e) => props.onSpeedChange(e.target.value)}
        />
      </FormLabel>
      <FormLabel w="65%">
        MIDI Input
        <Select
          onChange={(e) => props.onSourceChange(parseInt(e.target.value))}
        >
          {props.options.map((item, index) => (
            <option value={index}>{item}</option>
          ))}
        </Select>
      </FormLabel>
    </>
  );
}
