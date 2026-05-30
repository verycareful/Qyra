//! Build a PDF 1.5 object stream (/ObjStm) from non-stream objects.
//! Decoded layout: `objnum off objnum off … <body0> <body1> …`
//! (header is N space-separated pairs; /First = header byte length).
use crate::pdf::error::PdfError;
use crate::pdf::types::{ObjectId, PdfDict, PdfObject, PdfStream};
use crate::pdf::writer::serialize::write_object_body;

/// Flate-compress a buffer at best compression. Shared by the xref-stream builder.
pub(crate) fn flate_compress(data: &[u8]) -> Vec<u8> {
    use flate2::{write::ZlibEncoder, Compression};
    use std::io::Write;
    let mut e = ZlibEncoder::new(Vec::new(), Compression::best());
    e.write_all(data).expect("zlib write to Vec is infallible");
    e.finish().expect("zlib finish to Vec is infallible")
}

/// Pack `members` (all non-stream objects, generation 0) into one ObjStm.
pub fn build_objstm(members: &[(ObjectId, PdfObject)]) -> Result<PdfStream, PdfError> {
    let mut header = Vec::new();
    let mut bodies = Vec::new();
    for (id, obj) in members {
        header.extend_from_slice(format!("{} {} ", id.0, bodies.len()).as_bytes());
        write_object_body(&mut bodies, obj)?;
        bodies.push(b' '); // delimiter so adjacent tokens don't merge
    }
    let first = header.len();
    let mut decoded = header;
    decoded.extend_from_slice(&bodies);
    let compressed = flate_compress(&decoded);

    let mut dict = PdfDict::new();
    dict.set(b"Type", PdfObject::Name(b"ObjStm".to_vec()));
    dict.set(b"N", PdfObject::Integer(members.len() as i64));
    dict.set(b"First", PdfObject::Integer(first as i64));
    dict.set(b"Filter", PdfObject::Name(b"FlateDecode".to_vec()));
    dict.set(b"Length", PdfObject::Integer(compressed.len() as i64));
    Ok(PdfStream {
        dict,
        raw_bytes: compressed,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pdf::parser::object_stream::parse_object_stream;

    #[test]
    fn objstm_round_trips_through_parser() {
        let mut d = PdfDict::new();
        d.set(b"Type", PdfObject::Name(b"Page".to_vec()));
        let members = vec![
            ((10u32, 0u16), PdfObject::Integer(42)),
            ((11u32, 0u16), PdfObject::Dictionary(d)),
            ((12u32, 0u16), PdfObject::Boolean(true)),
        ];
        let stream = build_objstm(&members).unwrap();
        let parsed = parse_object_stream(&stream).unwrap();
        assert_eq!(parsed.len(), 3);
        assert_eq!(parsed[0].0, (10, 0));
        assert!(matches!(parsed[0].1, PdfObject::Integer(42)));
        assert_eq!(parsed[1].0, (11, 0));
        assert!(parsed[1].1.as_dict().is_some());
        assert!(matches!(parsed[2].1, PdfObject::Boolean(true)));
    }
}
