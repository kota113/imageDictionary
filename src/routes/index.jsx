import {
    Avatar,
    Box,
    Button,
    Checkbox,
    Container,
    FormControlLabel, FormGroup, Grid,
    IconButton,
    List, ListItem, ListItemAvatar, ListItemIcon, ListItemText,
    TextField,
    Typography
} from "@mui/material";
import {Delete, Folder} from "@mui/icons-material";
import {createRef, useRef, useState} from "react";


function FolderIcon() {
    return null;
}

function WordList() {
    const [wordList, setWordList] = useState([]);
    const textFieldRef = useRef(null);

    function addWord(event) {
        const word = textFieldRef.current.value;
        if (wordList.includes(word) || word.replaceAll(" ", "") === "") {
            textFieldRef.current.value = "";
            return;
        }
        setWordList([...wordList, word]);
        textFieldRef.current.value = "";
    }


    return (
        <>
            <Typography variant={"h4"}>
                Word List
            </Typography>
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", marginTop: "0.75rem"}}>
                <TextField id="outlined-basic" label="Enter a word" variant="outlined"
                           style={{display: "inline-block"}} color={"success"} fullWidth={true} inputRef={textFieldRef} />
                <Button
                    variant={"contained"}
                    color={"success"}
                    style={{display: "inline-block", marginLeft: "10px"}}
                    onClick={addWord}
                >
                    Add
                </Button>
            </div>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.2rem"}}>
                <Button variant={"contained"} color={"info"} style={{display: "inline-block"}}>search images</Button>
                <Button variant={"contained"} color={"error"} ><Delete/></Button>
            </div>
            <Box sx={{ flexGrow: 1, maxWidth: 752 }}>
                <Grid item xs={12} md={6}>
                  <div>
                    <List dense={true}>
                        {wordList.map((word) => {
                            const textRef = createRef();

                            function removeWord(event) {
                                const word = textRef.current.innerText;
                                setWordList(wordList.filter((w) => w !== word));
                            }

                            return (
                                <ListItem
                                  secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={removeWord}>
                                      <Delete />
                                    </IconButton>
                                  }
                                >
                                    <ListItemText ref={textRef}  primary={word}/>
                                </ListItem>
                            )
                        })}
                    </List>
                  </div>
                </Grid>
            </Box>
        </>
    )
}

function Images() {
    return (
        <></>
    )
}

export default function SearchPage() {
    return (
        <Container style={{marginTop: "0.7rem"}}>
            <WordList/>
            <Images/>
        </Container>
    )
}
