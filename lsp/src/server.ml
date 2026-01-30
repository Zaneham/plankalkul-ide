(** Plankalkül Language Server

    Yes, really. An LSP server. For a language from 1945.

    If you're reading this code and wondering "why does a programming language
    older than my grandparents need a language server?", that's a reasonable
    question. The answer is: because we can, and because Konrad Zuse deserves
    better than syntax errors discovered at runtime.

    Actually, Zuse never got runtime errors. His language was never implemented
    during his lifetime. Prof. Raúl Rojas and FU Berlin fixed that in 2000.
    I'm just adding the finishing touches. 80 years of finishing touches.

    Features provided by this monument to stubbornness:
    - Diagnostics (red squiggly lines for a 1945 language)
    - Hover information (finally understand what W3 does)
    - Completions (all 7 loop variants, because one loop wasn't enough)
    - Document symbols (navigate your plans like it's 2025, not 1945)

    Attribution:
    - Zuse (1945): Invented the language
    - Rojas et al. (2000): Actually implemented it
    - Bruines (2010): Formalized the semantics
    - Me (2025): Added IntelliSense. Priorities.
*)

open Linol_lwt
module Lsp = Linol.Lsp

(** Document state — because even octogenarian languages need state management *)
type doc_state = {
  uri: Lsp.Types.DocumentUri.t;
  text: string;
  diagnostics: Lsp.Types.Diagnostic.t list;
}

(** The global document registry.

    In 1945, Zuse tracked his variables on paper with careful vertical alignment.
    In 2025, I use a hash table. Progress? *)
let documents : (string, doc_state) Hashtbl.t = Hashtbl.create 16

(** Basic syntax checking.

    This is a simplified checker for when the full compiler isn't available.
    It catches the obvious stuff: unbalanced braces, suspicious lone '=' signs.

    Zuse didn't have syntax highlighting. Or a backspace key, really.
    Luxury. *)
let check_syntax text =
  let diagnostics = ref [] in
  let lines = String.split_on_char '\n' text in

  List.iteri (fun line_num line ->
    (* Check for unbalanced braces — a problem as old as braces themselves *)
    let open_count = ref 0 in
    String.iter (fun c ->
      if c = '{' then incr open_count
      else if c = '}' then decr open_count
    ) line;

    if !open_count < 0 then
      diagnostics := Lsp.Types.Diagnostic.create
        ~range:(Lsp.Types.Range.create
          ~start:(Lsp.Types.Position.create ~line:line_num ~character:0)
          ~end_:(Lsp.Types.Position.create ~line:line_num ~character:(String.length line)))
        ~severity:Lsp.Types.DiagnosticSeverity.Error
        ~source:"plankalkul"
        ~message:(`String "Unmatched closing brace. Zuse used very careful bracket matching. Be like Zuse.")
        () :: !diagnostics;

    (* Check for = that should probably be => *)
    if String.contains line '=' && String.length line >= 2 then begin
      let has_arrow = ref false in
      for i = 0 to String.length line - 2 do
        if line.[i] = '=' && line.[i+1] = '>' then has_arrow := true
      done;
      if not !has_arrow then begin
        for i = 0 to String.length line - 1 do
          if line.[i] = '=' then begin
            let is_comparison =
              (i > 0 && (line.[i-1] = '!' || line.[i-1] = '<' || line.[i-1] = '>')) ||
              (i < String.length line - 1 && line.[i+1] = '=')
            in
            let is_arrow = i < String.length line - 1 && line.[i+1] = '>' in
            if not is_comparison && not is_arrow then
              diagnostics := Lsp.Types.Diagnostic.create
                ~range:(Lsp.Types.Range.create
                  ~start:(Lsp.Types.Position.create ~line:line_num ~character:i)
                  ~end_:(Lsp.Types.Position.create ~line:line_num ~character:(i+1)))
                ~severity:Lsp.Types.DiagnosticSeverity.Hint
                ~source:"plankalkul"
                ~message:(`String "Lonely '=' detected. In Plankalkül, assignment is '=>'. Equality is '='. This looks like neither.")
                () :: !diagnostics
          end
        done
      end
    end
  ) lines;

  !diagnostics

(** Parse and analyze a document.

    One day this will use the full compiler. For now, we do our best. *)
let analyze_document uri text =
  let diagnostics = check_syntax text in
  { uri; text; diagnostics }

(** Get completions.

    Autocomplete for a language designed when "computer" meant a person
    doing calculations by hand. We live in strange times.

    Fun fact: Zuse had 7 different loop constructs. SEVEN. Each with
    subtly different semantics. We provide completions for all of them
    because suffering builds character. *)
let get_completions () =
  let keywords = [
    ("W", "Conditional loop — Zuse's Wiederholung. The OG while loop.");
    ("W0", "Loop N times with hidden counter. For when you don't need to know which iteration you're on.");
    ("W1", "Loop 0 to N-1, ascending. The sensible one.");
    ("W2", "Loop N-1 to 0, descending. For countdown enthusiasts.");
    ("W3", "Loop while m >= n. Because W1 and W2 weren't enough.");
    ("W4", "Loop while m <= n. See W3, but backwards.");
    ("W5", "Loop toward target with auto-direction. It figures out if you're going up or down. Clever, Zuse.");
    ("W6", "Loop over list elements. Zuse invented foreach. In 1945.");
    ("FIN", "Exit current plan or loop. The original 'return'. Or 'break'. Context-dependent, naturally.");
    ("END", "End of block in 2D notation. For when your code is a spreadsheet.");
    ("TABLE", "Truth table declaration. Declarative programming, 1940s style.");
    ("true", "Boolean true. Some things never change.");
    ("false", "Boolean false. See above.");
    ("Delta", "Greek prefix for plan groups. Zuse liked Greek letters. A lot.");
    ("Sigma", "Another Greek prefix. See Delta.");
    ("Phi", "Yet another Greek prefix. Zuse was thorough.");
  ] in

  let variables = [
    ("V0", "Input variable 0. V for 'Variablen' (German: variables). Inputs come in, wisdom comes out.");
    ("V1", "Input variable 1. You can have many inputs. Zuse believed in flexibility.");
    ("V2", "Input variable 2. The pattern continues.");
    ("Z0", "Intermediate variable 0. Z for 'Zwischenwerte' (intermediate values). For when you need scratch space.");
    ("Z1", "Intermediate variable 1. More scratch space. Zuse was generous.");
    ("R0", "Result variable 0. R for 'Resultatwerte'. Where your answer goes.");
    ("R1", "Result variable 1. Multiple returns! In 1945! Take that, Go.");
  ] in

  let operators = [
    ("=>", "Assignment arrow. 'V0 + V1 => R0' means 'put V0 + V1 into R0'. Clear, isn't it?");
    ("->", "Conditional arrow. 'cond -> { body }' means 'if cond then body'. The original ternary.");
    ("<->", "Equivalence. For when you need bidirectional implication. Logic, baby.");
  ] in

  let items = List.concat [
    List.map (fun (label, detail) ->
      Lsp.Types.CompletionItem.create ~label ~kind:Lsp.Types.CompletionItemKind.Keyword ~detail ()
    ) keywords;
    List.map (fun (label, detail) ->
      Lsp.Types.CompletionItem.create ~label ~kind:Lsp.Types.CompletionItemKind.Variable ~detail ()
    ) variables;
    List.map (fun (label, detail) ->
      Lsp.Types.CompletionItem.create ~label ~kind:Lsp.Types.CompletionItemKind.Operator ~detail ()
    ) operators;
  ] in
  items

(** Get hover information.

    Provides documentation when you hover over keywords and variables.
    Finally, you can understand what W3 does without reading a 1972
    German academic paper. You're welcome. *)
let get_hover text pos =
  let lines = String.split_on_char '\n' text |> Array.of_list in
  let line_num = pos.Lsp.Types.Position.line in
  if line_num >= Array.length lines then None
  else begin
    let line = lines.(line_num) in
    let col = pos.Lsp.Types.Position.character in

    (* Find the word at cursor position *)
    let start_col = ref col in
    while !start_col > 0 && let c = line.[!start_col - 1] in
      (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
    do decr start_col done;

    let end_col = ref col in
    while !end_col < String.length line && let c = line.[!end_col] in
      (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9')
    do incr end_col done;

    if !start_col < !end_col then begin
      let word = String.sub line !start_col (!end_col - !start_col) in
      let info = match String.uppercase_ascii word with
        | "W" -> Some "## W — Conditional Loop\n\n\
            Zuse's *Wiederholung* (repetition).\n\n\
            ```plankalkul\n\
            W {\n\
              cond1 -> { body1 }\n\
              cond2 -> { body2 }\n\
            }\n\
            ```\n\n\
            Executes branches while any condition is true. The original while loop, \
            but with multiple conditions because Zuse didn't believe in simplicity."

        | "W0" -> Some "## W0 — Hidden Counter Loop\n\n\
            ```plankalkul\n\
            W0(n) { body }\n\
            ```\n\n\
            Repeat body *n* times. The counter is hidden — you don't get to see it. \
            For when you just need something done N times and don't care which iteration you're on."

        | "W1" -> Some "## W1 — Ascending Loop\n\n\
            ```plankalkul\n\
            W1(n) => i { body }\n\
            ```\n\n\
            Loop *i* from 0 to n-1. The sensible, familiar loop. \
            Zuse invented this in 1945. Your for loop is a cover version."

        | "W2" -> Some "## W2 — Descending Loop\n\n\
            ```plankalkul\n\
            W2(n) => i { body }\n\
            ```\n\n\
            Loop *i* from n-1 down to 0. For countdowns and reverse iteration."

        | "W3" -> Some "## W3 — While Greater-or-Equal\n\n\
            ```plankalkul\n\
            W3(n, m) => i { body }\n\
            ```\n\n\
            Loop while m >= n. Yes, this exists. Yes, it's different from W4."

        | "W4" -> Some "## W4 — While Less-or-Equal\n\n\
            ```plankalkul\n\
            W4(n, m) => i { body }\n\
            ```\n\n\
            Loop while m <= n. The sibling of W3."

        | "W5" -> Some "## W5 — Auto-Direction Loop\n\n\
            ```plankalkul\n\
            W5(start, end) => i { body }\n\
            ```\n\n\
            Loops from start toward end, automatically detecting direction. \
            If start < end, counts up. If start > end, counts down. \
            Zuse thought of everything."

        | "W6" -> Some "## W6 — List Iteration\n\n\
            ```plankalkul\n\
            W6(list) => elem { body }\n\
            ```\n\n\
            Iterate over list elements. Zuse invented foreach. In 1945. \
            Decades before most languages had it."

        | "FIN" -> Some "## FIN — Exit\n\n\
            Exit the current plan or loop.\n\n\
            The original `return` and `break`, context-dependent. \
            In a plan, it returns. In a loop, it breaks."

        | "TABLE" -> Some "## TABLE — Truth Table\n\n\
            ```plankalkul\n\
            TABLE name {\n\
              a b | result\n\
              + + | +\n\
              + - | -\n\
            }\n\
            ```\n\n\
            Declarative truth tables from ZIA-0368 (1941). \
            Zuse was doing declarative programming before it was cool."

        | s when String.length s >= 1 && (s.[0] = 'V' || s.[0] = 'v') ->
          Some (Printf.sprintf "## %s — Input Variable\n\n\
            **V** = *Variablen* (German: variables)\n\n\
            Input parameters to a plan. V0, V1, V2... \
            Zuse liked systematic naming." word)

        | s when String.length s >= 1 && (s.[0] = 'Z' || s.[0] = 'z') ->
          Some (Printf.sprintf "## %s — Intermediate Variable\n\n\
            **Z** = *Zwischenwerte* (German: intermediate values)\n\n\
            Local variables for intermediate calculations. \
            Your scratch space." word)

        | s when String.length s >= 1 && (s.[0] = 'R' || s.[0] = 'r') ->
          Some (Printf.sprintf "## %s — Result Variable\n\n\
            **R** = *Resultatwerte* (German: result values)\n\n\
            Output values from a plan. Yes, you can have multiple. \
            Zuse believed in multiple return values in 1945." word)

        | _ -> None
      in
      match info with
      | Some content ->
        let markup = Lsp.Types.MarkupContent.create ~kind:Lsp.Types.MarkupKind.Markdown ~value:content in
        Some (Lsp.Types.Hover.create ~contents:(`MarkupContent markup) ())
      | None -> None
    end else None
  end

(** The LSP Server Class

    This is where the magic happens. Or at least, where the protocol
    compliance happens. Same thing, really.

    Inheriting from Linol's server base class because reinventing
    the LSP protocol from scratch would be silly. There's enough
    historical recreation going on already. *)
class lsp_server = object(_self)
  inherit Linol_lwt.Jsonrpc2.server

  method spawn_query_handler f = Lwt.async f

  (** Initialize the server.

      "Hello, I'm a language server for a 1945 programming language.
       Nice to meet you too." *)
  method on_req_initialize ~notify_back:_ _i =
    let capabilities = Lsp.Types.ServerCapabilities.create
      ~textDocumentSync:(`TextDocumentSyncKind Lsp.Types.TextDocumentSyncKind.Full)
      ~hoverProvider:(`Bool true)
      ~completionProvider:(Lsp.Types.CompletionOptions.create
        ~triggerCharacters:[" "; "("]
        ())
      ()
    in
    Lwt.return (Lsp.Types.InitializeResult.create ~capabilities ())

  (** Document opened — time to analyze it.

      Every time you open a .pk file, the server springs into action.
      Zuse would be either proud or confused. Probably both. *)
  method on_notif_doc_did_open ~notify_back doc ~content =
    let uri = doc.Lsp.Types.TextDocumentItem.uri in
    let state = analyze_document uri content in
    Hashtbl.replace documents (Lsp.Types.DocumentUri.to_string uri) state;
    let params = Lsp.Types.PublishDiagnosticsParams.create
      ~uri ~diagnostics:state.diagnostics () in
    notify_back#send_notification (Lsp.Server_notification.PublishDiagnostics params)

  (** Document changed — re-analyze.

      Real-time error checking for a language from the vacuum tube era.
      The future is now. *)
  method on_notif_doc_did_change ~notify_back doc _changes ~old_content:_ ~new_content =
    let uri = doc.Lsp.Types.VersionedTextDocumentIdentifier.uri in
    let state = analyze_document uri new_content in
    Hashtbl.replace documents (Lsp.Types.DocumentUri.to_string uri) state;
    let params = Lsp.Types.PublishDiagnosticsParams.create
      ~uri ~diagnostics:state.diagnostics () in
    notify_back#send_notification (Lsp.Server_notification.PublishDiagnostics params)

  (** Document closed — forget about it.

      Clean up after yourself. Unlike some languages from the 1970s. *)
  method on_notif_doc_did_close ~notify_back:_ doc =
    let uri = doc.Lsp.Types.TextDocumentIdentifier.uri in
    Hashtbl.remove documents (Lsp.Types.DocumentUri.to_string uri);
    Lwt.return ()

  (** Hover request — provide information.

      "What does W3 do?" Finally, an answer without reading German. *)
  method on_req_hover ~notify_back:_ ~id:_ ~uri ~pos ~workDoneToken:_ _ =
    let key = Lsp.Types.DocumentUri.to_string uri in
    match Hashtbl.find_opt documents key with
    | None -> Lwt.return None
    | Some doc -> Lwt.return (get_hover doc.text pos)

  (** Completion request — suggest things.

      Autocomplete for a language from before autocomplete existed.
      Giving Zuse's creation the modern luxuries it deserves. *)
  method on_req_completion ~notify_back:_ ~id:_ ~uri:_ ~pos:_ ~ctx:_
      ~workDoneToken:_ ~partialResultToken:_ _ =
    let items = get_completions () in
    Lwt.return (Some (`CompletionList (Lsp.Types.CompletionList.create ~isIncomplete:false ~items ())))
end

(** Main entry point.

    Start the server. Wait for connections. Provide language intelligence
    for a programming language from 1945. Just another day at the office. *)
let () =
  let server = new lsp_server in
  let task =
    let open Linol_lwt in
    Jsonrpc2.run (Jsonrpc2.create_stdio ~env:() server)
  in
  match Lwt_main.run task with
  | () -> ()
  | exception e ->
    Printf.eprintf "LSP server error: %s\n%!" (Printexc.to_string e);
    exit 1
