// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract ConfessionWall {
    struct Confession {
        uint256 id;
        address author;
        string text;
        uint256 timestamp;
    }

    Confession[] private confessions;

    mapping(uint256 => mapping(address => bool)) private _hasLiked;
    mapping(uint256 => uint256) private _likeCount;

    uint256 public constant MAX_LENGTH = 280;

    event NewConfession(uint256 indexed id, address indexed author, string text, uint256 timestamp);
    event Liked(uint256 indexed id, address indexed liker);

    function confess(string calldata _text) external {
        bytes memory raw = bytes(_text);
        require(raw.length > 0, "Confession is empty");
        require(raw.length <= MAX_LENGTH, "Confession too long");

        uint256 id = confessions.length;
        confessions.push(Confession({ id: id, author: msg.sender, text: _text, timestamp: block.timestamp }));
        emit NewConfession(id, msg.sender, _text, block.timestamp);
    }

    function like(uint256 id) external {
        require(id < confessions.length, "Invalid confession");
        require(!_hasLiked[id][msg.sender], "Already liked");
        _hasLiked[id][msg.sender] = true;
        _likeCount[id]++;
        emit Liked(id, msg.sender);
    }

    function total() external view returns (uint256) {
        return confessions.length;
    }

    function getAll() external view returns (Confession[] memory) {
        return confessions;
    }

    function getRange(uint256 start, uint256 count) external view returns (Confession[] memory) {
        uint256 len = confessions.length;
        if (start >= len) return new Confession[](0);
        uint256 end = start + count > len ? len : start + count;
        Confession[] memory page = new Confession[](end - start);
        for (uint256 i = start; i < end; i++) {
            page[i - start] = confessions[i];
        }
        return page;
    }

    // Batch-fetch like counts and whether `liker` has liked each confession in a range.
    // Pass zero address as liker when no wallet is connected.
    function getLikesForRange(uint256 start, uint256 count, address liker)
        external view
        returns (uint256[] memory counts, bool[] memory liked)
    {
        uint256 len = confessions.length;
        if (start >= len) return (new uint256[](0), new bool[](0));
        uint256 end = start + count > len ? len : start + count;
        uint256 size = end - start;
        counts = new uint256[](size);
        liked  = new bool[](size);
        for (uint256 i = 0; i < size; i++) {
            counts[i] = _likeCount[start + i];
            liked[i]  = _hasLiked[start + i][liker];
        }
    }
}
